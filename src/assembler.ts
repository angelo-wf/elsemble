import { Arguments } from "./arguments.js";
import { Directive } from "./directives.js";
import { ExpressionHandler, ExpressionResult } from "./expressionhandler.js";
import { ExpressionNode, NodeType } from "./expressionparser.js";
import { Line, LineType } from "./lineparser.js";
import { OpcodeHandler } from "./opcodehandler.js";
import { Architecture, parseArchitecture } from "./opcodes.js";
import { ReadHandler } from "./readhandler.js";
import { WriteHandler } from "./writehandler.js";

type IncludeItem = {
  path: string,
  line: number,
  offset: number,
  isMacro: boolean,
  arch?: Architecture
};

enum FlowType {
  MAIN,
  IF,
  REPEAT
};

type FlowItem = {
  type: FlowType,
  active: boolean,
  taken: boolean
} & ({
  type: FlowType.MAIN
} | {
  type: FlowType.IF,
  found: boolean,
  inElse: boolean
} | {
  type: FlowType.REPEAT,
  count: number,
  num: number,
  name?: string,
  line: number,
  includeItem: IncludeItem
});

type Label = {
  value: ExpressionResult,
  defined: boolean,
  redefinable: boolean
};

type Macro = {
  args: string[],
  lines: Line[],
  path: string,
  line: number
};

const defaultPassLimit = 10;
const stackLimit = 256;

export class Assembler {

  private readHandler = new ReadHandler(this);
  private expressionHandler = new ExpressionHandler(this);
  private opcodeHandler = new OpcodeHandler(this);
  private writeHandler: WriteHandler;

  private arguments: Arguments;

  private includeStack: IncludeItem[] = [];
  private flowStack: FlowItem[] = [];
  private blockStack: string[] = [];
  private blockNum = 0;

  private labels: Map<string, Label> = new Map();
  private scope = "";
  private globalLabel?: string;

  private macros: Map<string, Macro> = new Map();
  private definingMacro?: string;

  private changedLabel?: string;
  private passError?: string;
  private passNum = 0;

  private pc = 0;
  private fillByte = 0;

  constructor(argument: Arguments) {
    this.arguments = argument;
    this.writeHandler = new WriteHandler(this, argument.outputFile, argument.listingFile, argument.symbolFile, argument.expandedList);
  }

  // assemble using given arguments, returns if it succeeded
  assemble(): boolean {
    while(this.passNum < (this.arguments.passLimit ?? defaultPassLimit)) {
      if(this.arguments.verbose) console.log(`Pass ${this.passNum + 1}...`);
      this.doPass();
      if(!this.changedLabel) break;
    }
    if(this.changedLabel) {
      // force this error above other errors
      this.passError = `Pass limit reached, label '${this.getLabelName(this.changedLabel)}' kept changing`;
    }
    if(this.passError) {
      // error in last pass
      console.error(this.passError);
      return false;
    }
    // succesfull assembly, write output
    if(this.arguments.verbose) console.log(`Writing output...`);
    this.writeHandler.writeFiles();
    if(this.passError) {
      // error while writing files
      console.error(this.passError);
      return false;
    }
    return true;
  }

  private doPass(): void {
    this.writeHandler.startPass();
    this.opcodeHandler.startPass();
    // reset stacks
    this.includeStack = [];
    this.flowStack = [{type: FlowType.MAIN, active: true, taken: true}];
    this.blockStack = [];
    this.blockNum = 0;
    // reset label defined state
    for(let [_, val] of this.labels) val.defined = false;
    this.scope = "";
    this.globalLabel = undefined;
    // reset macros (clear, as they need to be defined before use)
    this.macros.clear();
    this.definingMacro = undefined;
    // reset pass state
    this.changedLabel = undefined;
    this.passError = undefined;
    // reset other state
    this.pc = 0;
    this.fillByte = 0;
    // handle input file (as if include)
    this.handleFile(this.arguments.inputFile, this.arguments.arch);
    // check that no items (if, macro, etc) were left open
    if(this.flowStack.length > 1) {
      this.logError(`Unclosed ${this.flowStack.at(-1)!.type === FlowType.IF ? ".if" : ".repeat"} statement`);
    }
    if(this.definingMacro) {
      this.logError("Unclosed macro definition");
    }
    for(let [name, val] of this.labels) {
      if(!val.defined) {
        // label was not defined at all this pass, delete it and do another
        this.labels.delete(name);
        this.changedLabel = name;
      }
    }
    this.passNum++;
  }

  private handleFile(path: string, arch?: Architecture): void {
    if(this.includeStack.length > stackLimit) return this.logError("Include/macro stack limit reached");
    // parse, add include item, run, and pop item
    let parsed = this.readHandler.readAssemblyFile(path, arch);
    this.includeStack.push({path, line: 1, offset: 1, isMacro: false, arch});
    this.handleLines(parsed);
    this.includeStack.pop();
  }

  private handleMacro(name: string, args: ExpressionNode[]): void {
    if(!this.macros.has(name)) return this.logError(`Undefined macro '${name}'`);
    let macro = this.macros.get(name)!;
    if(macro.args.length !== args.length) return this.logError("Incorrect amount of arguments");
    if(this.includeStack.length > stackLimit) return this.logError("Include/macro stack limit reached");
    // evaluate args, then add new block and define macro arguments
    let argValues = args.map(a => this.eval(a));
    this.blockStack.push(`@m${this.blockNum++}`);
    for(let i = 0; i < args.length; i++) {
      this.defineLabel(macro.args[i]!, argValues[i]!, false);
    }
    // add include item and run macro, copy over architecture into macro
    let arch = this.includeStack.at(-1)!.arch;
    this.includeStack.push({path: macro.path, line: macro.line, offset: macro.line, isMacro: true, arch});
    this.writeHandler.modifyDepth(1);
    this.handleLines(macro.lines);
    // check that no repeat was opened, then pop include item
    if(!this.blockStack.at(-1)!.startsWith("@m")) {
      this.logError("Unclosed .repeat-statement within macro");
      while(!this.blockStack.at(-1)!.startsWith("@m")) this.blockStack.pop();
    }
    this.blockStack.pop();
    this.writeHandler.modifyDepth(-1);
    this.includeStack.pop();
  }

  private handleLines(lines: Line[]): void {
    let includeItem = this.includeStack.at(-1)!;
    while(true) {
      let i = includeItem.line - includeItem.offset;
      if(i >= lines.length) break;
      let line = lines[i]!;
      // handle line
      this.writeHandler.startLine(this.pc, line.raw);
      let flowItem = this.flowStack.at(-1)!;
      let active = flowItem.active && flowItem.taken;
      // handle macro definition
      if(this.definingMacro) {
        if(line.type === LineType.DIRECTIVE && (line.directive === Directive.MACRO || line.directive === Directive.ENDMACRO)) {
          // pass through macro-directives
          this.handleDirective(line.directive, line.arguments);
        } else {
          this.macros.get(this.definingMacro)!.lines.push(line);
        }
        includeItem.line++;
        continue;
      }
      // define label
      if(line.label && line.type !== LineType.ASSIGNMENT && active) {
        let name = this.defineLabel(line.label, this.pc, false);
        if(!name.includes(".") && !name.includes("@")) {
          this.globalLabel = name;
        }
      }
      // handle line
      switch(line.type) {
        case LineType.ASSIGNMENT:
          if(!active) break;
          this.defineLabel(line.label, this.eval(line.value), line.reassignment);
          break;
        case LineType.DIRECTIVE:
          this.handleDirective(line.directive, line.arguments);
          break;
        case LineType.OPCODE:
          if(!active) break;
          if(line.arch !== includeItem.arch) this.logError("Architecture mismatch between parsed and current");
          this.pc += this.opcodeHandler.emitOpcode(line.arch, line.opcode, line.modeNum, line.arguments);
          break;
        case LineType.MACRO:
          if(!active) break;
          this.handleMacro(line.macro, line.arguments);
          break;
        case LineType.NONE: break;
        default: throw (line satisfies never);
      }
      includeItem.line++;
    }
  }

  // log an error in this pass (but does not terminate pass)
  logError(msg: string, location?: [string, number]): void {
    let error = msg;
    if(location) {
      error = `${location[0]}:${location[1]} ${msg}`;
      error += this.getStackTrace(false, 0);
    } else if(this.includeStack.length > 0) {
      let includeInfo = this.includeStack.at(-1)!;
      error = `${includeInfo.path}:${includeInfo.line} ${msg}`;
      error += this.getStackTrace(includeInfo.isMacro, 1);
    }
    if(!this.passError) this.passError = error;
  }

  private getStackTrace(isMacro: boolean, skip: number): string {
    let out = "";
    for(let i = this.includeStack.length - 1 - skip; i >= 0; i--) {
      let item = this.includeStack[i]!;
      out += `\n${isMacro ? "Expanded at" : "Included at"} ${item.path}:${item.line}`;
      isMacro = item.isMacro;
    }
    return out;
  }

  // label handling

  // get current pc
  getPc(): number {
    return this.pc;
  }

  private defineLabel(label: string, value: ExpressionResult, reassignment: boolean): string {
    let name = this.expandLabelName(label)[0];
    // if no name returned, an error was logged by expandLabelName
    if(!name) return "";
    let current = this.labels.get(name);
    if(current) {
      if(current.defined && (!current.redefinable || !reassignment)) {
        this.logError(`Attempted to redefined label '${this.getLabelName(name)}'`);
      }
      // if this the first assigment or a allowed redefinition
      if(current.redefinable || !current.defined) {
        // if it is not a reassignment (so first assignment), indicate if labels changed
        if(!current.redefinable && current.value !== value) this.changedLabel = name; 
        current.value = value;
      }
      current.defined = true;
    } else {
      this.labels.set(name, {value, defined: true, redefinable: reassignment});
      this.changedLabel = name;
    }
    return name;
  }

  // get result for evaluating label, or 0 if it is not known yet
  getLabelValue(name: string): ExpressionResult {
    let expandedNames = this.expandLabelName(name);
    // try each label to test in order
    for(let name of expandedNames) {
      if(this.labels.has(name)) {
        let label = this.labels.get(name)!;
        // don't allow getting value of redefinable label
        if(label.redefinable && !label.defined) {
          this.logError(`Accessed label '${this.getLabelName(name)}' before first definition`);
        }
        return label.value;
      }
    }
    // value not known yet, default to 0
    this.logError(`Undefined label '${this.getLabelName(expandedNames[0] ?? "")}'`);
    return 0;
  }

  private expandLabelName(label: string): string[] {
    if(label.startsWith("@")) {
      // block label, check if in block and return list to search
      if(this.blockStack.length === 0) {
        this.logError("Cannot use block label outside .repeat or .macro block");
        return [];
      }
      let names: string[] = [];
      for(let i = this.blockStack.length - 1; i >= 0; i--) {
        let prefix = this.blockStack[i]!;
        names.push(`${prefix}${label}`);
        // don't go beyond macro block
        if(prefix.startsWith("@m")) break;
      }
      return names;
    }
    if(label.includes(":")) {
      return [label];
    }
    if(label.startsWith(".")) {
      if(!this.globalLabel) {
        this.logError("Cannot use local label before defining global label");
        return [];
      }
      return [`${this.globalLabel}${label}`];
    }
    return [`${this.scope}:${label}`, ...(this.scope ? [`:${label}`] : [])];
  }

  private getLabelName(name: string): string {
    if(name.startsWith("@")) return name.slice(name.indexOf("@", 1));
    return name.startsWith(":") ? name.slice(1) : name;
  }

  // get all non-redefinable, non-block labels and their values
  getSymbols(): [string, string | number][] {
    let out: [string, string | number][] = [];
    for(let [name, label] of this.labels) {
      if(!name.startsWith("@") && !label.redefinable) {
        out.push([this.getLabelName(name), label.value]);
      }
    }
    return out;
  }

  // value testing

  // check and turn result into number
  checkNumber(val: ExpressionResult): number {
    if(typeof val === "string") {
      this.logError("Expected number");
      return 0;
    }
    return val;
  }

  // check and turn result into string
  checkString(val: ExpressionResult): string {
    if(typeof val === "number") {
      this.logError("Expected string");
      return "";
    }
    return val;
  }

  // check result for being number in certain range and/or positive
  checkRange(val: ExpressionResult, allowNeg: boolean, bitSize = 0): number {
    let num = this.checkNumber(val);
    if(num < 0 && !allowNeg) {
      this.logError("Expected positive number");
      return 0;
    }
    if(bitSize > 0) {
      if(num < -(2 ** (bitSize - 1)) || num >= (2 ** bitSize)) {
        this.logError("Value out of range");
        num &= (2 ** bitSize) - 1;
      }
    }
    return num;
  }

  // evaluate expression
  eval(node: ExpressionNode): ExpressionResult {
    if(node.type === NodeType.SUBEXPR) {
      this.logError("Unneeded brackets around expression");
    }
    return this.expressionHandler.evaluateExpression(node);
  }

  // write byte
  writeByte(byte: number): void {
    this.writeHandler.writeBytes(byte);
  }

  // write word
  writeWord(word: number): void {
    this.writeHandler.writeWords(word);
  }

  // write long
  writeLong(long: number): void {
    this.writeHandler.writeLongs(long);
  }

  // directive handling / helpers

  private handleDirective(directive: Directive, args: (ExpressionNode | string)[]): void {
    let flowItem = this.flowStack.at(-1)!;
    let active = flowItem.active && flowItem.taken;
    let arch = this.includeStack.at(-1)!.arch;
    switch(directive) {
      case Directive.IF: this.dirIf(args[0] as ExpressionNode, active); break;
      case Directive.ELIF: this.dirElif(args[0] as ExpressionNode, flowItem); break;
      case Directive.ELSE: this.dirElse(flowItem); break;
      case Directive.ENDIF: this.dirEndif(flowItem); break;
      case Directive.REREAT: this.dirRepeat(args[0] as ExpressionNode, active, args[1] as string | undefined); break;
      case Directive.ENDREPEAT: this.dirEndRepeat(flowItem); break;
      case Directive.MACRO: if(active) this.dirMacro(args[0] as string, args.slice(1) as string[]); break;
      case Directive.ENDMACRO: if(active) this.dirEndMacro(); break;
      case Directive.INCLUDE: if(active) this.dirInclude(args[0] as ExpressionNode); break;
      case Directive.ORG: if(active) this.dirOrg(args[0] as ExpressionNode); break;
      case Directive.FILLBYTE: if(active) this.dirFillByte(args[0] as ExpressionNode); break;
      case Directive.PAD: if(active) this.dirPad(args[0] as ExpressionNode, args[1] as ExpressionNode | undefined); break;
      case Directive.FILL: if(active) this.dirFill(args[0] as ExpressionNode, args[1] as ExpressionNode | undefined); break;
      case Directive.ALIGN: if(active) this.dirAlign(args[0] as ExpressionNode, args[1] as ExpressionNode | undefined); break;
      case Directive.RPAD: if(active) this.dirRpad(args[0] as ExpressionNode); break;
      case Directive.RES: if(active) this.dirRes(args[0] as ExpressionNode); break;
      case Directive.RALIGN: if(active) this.dirRalign(args[0] as ExpressionNode); break;
      case Directive.DB: if(active) this.dirDb(args as ExpressionNode[]); break;
      case Directive.DW: if(active) this.dirDw(args as ExpressionNode[]); break;
      case Directive.DL: if(active) this.dirDl(args as ExpressionNode[]); break;
      case Directive.DLB: if(active) this.dirDxb(args as ExpressionNode[], 0); break;
      case Directive.DHB: if(active) this.dirDxb(args as ExpressionNode[], 8); break;
      case Directive.DBB: if(active) this.dirDxb(args as ExpressionNode[], 16); break;
      case Directive.DLW: if(active) this.dirDlw(args as ExpressionNode[]); break;
      case Directive.INCBIN: if(active) this.dirIncBin(args[0] as ExpressionNode, args[1] as ExpressionNode | undefined, args[2] as ExpressionNode | undefined); break;
      case Directive.SCOPE: if(active) this.dirScope(args[0] as string); break;
      case Directive.ENDSCOPE: if(active) this.dirEndScope(); break;
      case Directive.ASSERT: if(active) this.dirAssert(args[0] as ExpressionNode, args[1] as ExpressionNode); break;
      case Directive.ARCH: this.dirArch(args[0] as string); break;
      case Directive.DIRPAGE: if(active) this.opcodeHandler.dirDirPage(args[0] as ExpressionNode, arch); break;
      case Directive.BANK: if(active) this.opcodeHandler.dirBank(args[0] as ExpressionNode, arch); break;
      case Directive.ASIZE: if(active) this.opcodeHandler.dirXsize(args[0] as ExpressionNode, false, arch); break;
      case Directive.ISIZE: if(active) this.opcodeHandler.dirXsize(args[0] as ExpressionNode, true, arch); break;
      case Directive.MIRROR: if(active) this.opcodeHandler.dirMirror(args[0] as ExpressionNode, args[1] as ExpressionNode, args[2] as ExpressionNode, args[3] as ExpressionNode, args[4] as ExpressionNode | undefined, arch); break;
      case Directive.CLRMIRROR: if(active) this.opcodeHandler.dirClrMirror(arch); break;
      default: throw (directive satisfies never);
    }
  }

  private handleDefineArgs(args: ExpressionNode[]): number[] {
    let out: number[] = [];
    for(let arg of args) {
      let res = this.eval(arg);
      if(typeof res === "string") {
        for(let char of [...res]) {
          out.push(char.codePointAt(0)!); // TODO: use char mapping
        }
      } else {
        out.push(res);
      }
    }
    return out;
  }

  // directives

  private dirIf(test: ExpressionNode, active: boolean): void {
    let res = this.eval(test) !== 0;
    this.flowStack.push({type: FlowType.IF, active, taken: res, found: res, inElse: false});
  }

  private dirElif(test: ExpressionNode, flowItem: FlowItem): void {
    if(flowItem.type !== FlowType.IF || flowItem.inElse) return this.logError("Unexpected .elif");
    if(flowItem.active) {
      let res = this.eval(test) !== 0;
      flowItem.taken = !flowItem.found && res;
      flowItem.found = flowItem.found || res;
    }
  }

  private dirElse(flowItem: FlowItem): void {
    if(flowItem.type !== FlowType.IF || flowItem.inElse) return this.logError("Unexpected .else");
    if(flowItem.active) {
      flowItem.taken = !flowItem.found;
      flowItem.inElse = true;
    }
  }

  private dirEndif(flowItem: FlowItem): void {
    if(flowItem.type !== FlowType.IF) return this.logError("Unexpected .endif");
    this.flowStack.pop();
  }

  private dirRepeat(amount: ExpressionNode, active: boolean, name?: string): void {
    let count = this.checkRange(this.eval(amount), false);
    let includeItem = this.includeStack.at(-1)!;
    this.flowStack.push({type: FlowType.REPEAT, active, taken: count > 0, count, num: 0, line: includeItem.line, includeItem, name});
    this.blockStack.push(`@r${this.blockNum++}`);
    if(name) this.defineLabel(name, 0, false);
  }

  private dirEndRepeat(flowItem: FlowItem): void {
    let includeItem = this.includeStack.at(-1)!;
    if(flowItem.type !== FlowType.REPEAT) return this.logError("Unexpected .endrepeat");
    if(!this.blockStack.at(-1)!.startsWith("@r")) return this.logError("Unexpected .endrepeat within macro");
    if(flowItem.includeItem !== includeItem) return this.logError(".repeat and .endrepeat must be in same file or macro");
    flowItem.num++;
    if(flowItem.active && flowItem.num < flowItem.count) {
      includeItem.line = flowItem.line;
      this.blockStack.pop();
      this.blockStack.push(`@r${this.blockNum++}`);
      if(flowItem.name) this.defineLabel(flowItem.name, flowItem.num, false);
      if(flowItem.num === 1) this.writeHandler.modifyDepth(1);
    } else {
      this.flowStack.pop();
      this.blockStack.pop();
      if(flowItem.num > 1) this.writeHandler.modifyDepth(-1);
    }
  }

  private dirMacro(name: string, args: string[]): void {
    if(this.definingMacro) return this.logError("Cannot define macro within macro");
    if(this.macros.has(name)) return this.logError(`Attempted to redefine macro '${name}'`);
    let includeItem = this.includeStack.at(-1)!;
    this.macros.set(name, {args, lines: [], path: includeItem.path, line: includeItem.line + 1});
    this.definingMacro = name;
  }

  private dirEndMacro(): void {
    if(!this.definingMacro) this.logError("Unexpected .endmacro");
    this.definingMacro = undefined;
  }

  private dirInclude(path: ExpressionNode): void {
    let pathStr = this.checkString(this.eval(path));
    let includeItem = this.includeStack.at(-1)!;
    this.handleFile(this.readHandler.getPath(pathStr, includeItem.path), includeItem.arch);
  }

  private dirOrg(loc: ExpressionNode): void {
    this.pc = this.checkRange(this.eval(loc), false);
  }

  private dirFillByte(byte: ExpressionNode): void {
    this.fillByte = this.checkRange(this.eval(byte), true, 8);
  }

  private dirPad(loc: ExpressionNode, byte?: ExpressionNode): void {
    let locVal = this.checkRange(this.eval(loc), false);
    let fill = byte ? this.checkRange(this.eval(byte), true, 8) : this.fillByte;
    let count = locVal - this.pc;
    if(count < 0) return this.logError("Attempted to pad backwards");
    this.writeHandler.writeByteTimes(fill, count);
    this.pc += count;
  }

  private dirFill(count: ExpressionNode, byte?: ExpressionNode): void {
    let countVal = this.checkRange(this.eval(count), false);
    let fill = byte ? this.checkRange(this.eval(byte), true, 8) : this.fillByte;
    this.writeHandler.writeByteTimes(fill, countVal);
    this.pc += countVal;
  }

  private dirAlign(align: ExpressionNode, byte?: ExpressionNode): void {
    let alignVal = this.checkRange(this.eval(align), false);
    if(alignVal === 0) {
      this.logError("Cannot align to multiple of 0");
      alignVal = 1;
    }
    let fill = byte ? this.checkRange(this.eval(byte), true, 8) : this.fillByte;
    let count = alignVal - (this.pc % alignVal);
    if(count !== alignVal) {
      this.writeHandler.writeByteTimes(fill, count);
      this.pc += count;
    }
  }

  private dirRpad(loc: ExpressionNode): void {
    let locVal = this.checkRange(this.eval(loc), false);
    let count = locVal - this.pc;
    if(count < 0) return this.logError("Attempted to pad backwards");
    this.pc += count;
  }

  private dirRes(count: ExpressionNode): void {
    this.pc += this.checkRange(this.eval(count), false);
  }

  private dirRalign(align: ExpressionNode): void {
    let alignVal = this.checkRange(this.eval(align), false);
    if(alignVal === 0) {
      this.logError("Cannot align to multiple of 0");
      alignVal = 1;
    }
    let count = alignVal - (this.pc % alignVal);
    if(count !== alignVal) this.pc += count;
  }

  private dirDb(args: ExpressionNode[]): void {
    let vals = this.handleDefineArgs(args).map(n => this.checkRange(n, true, 8));
    this.writeHandler.writeBytes(...vals);
    this.pc += vals.length;
  }

  private dirDw(args: ExpressionNode[]): void {
    let vals = this.handleDefineArgs(args).map(n => this.checkRange(n, true, 16));
    this.writeHandler.writeWords(...vals);
    this.pc += vals.length * 2;
  }

  private dirDl(args: ExpressionNode[]): void {
    let vals = this.handleDefineArgs(args).map(n => this.checkRange(n, true, 24));
    this.writeHandler.writeLongs(...vals);
    this.pc += vals.length * 3;
  }

  private dirDxb(args: ExpressionNode[], shift: number): void {
    let vals = this.handleDefineArgs(args).map(n => (this.checkNumber(n) >> shift) & 0xff);
    this.writeHandler.writeBytes(...vals);
    this.pc += vals.length;
  }

  private dirDlw(args: ExpressionNode[]): void {
    let vals = this.handleDefineArgs(args).map(n => this.checkNumber(n) & 0xffff);
    this.writeHandler.writeWords(...vals);
    this.pc += vals.length * 2;
  }

  private dirIncBin(path: ExpressionNode, start?: ExpressionNode, count?: ExpressionNode): void {
    let pathStr = this.checkString(this.eval(path));
    let includeItem = this.includeStack.at(-1)!;
    let startVal = start ? this.checkRange(this.eval(start), false) : 0;
    let countVal = count ? this.checkRange(this.eval(count), false) : undefined;
    let data = this.readHandler.readBinaryFile(this.readHandler.getPath(pathStr, includeItem.path));
    if(startVal > data.length) {
      this.logError("Start location beyond file length");
      startVal = 0;
    }
    if(countVal === undefined || (startVal + countVal > data.length)) {
      if(countVal !== undefined) this.logError("Range beyond file length");
      countVal = data.length - startVal;
    }
    this.writeHandler.writeBytes(...data.slice(startVal, startVal + countVal));
    this.pc += countVal;
  }

  private dirScope(name: string): void {
    this.scope = name;
    this.globalLabel = undefined;
  }

  private dirEndScope(): void {
    this.scope = "";
    this.globalLabel = undefined;
  }

  private dirAssert(test: ExpressionNode, msg: ExpressionNode): void {
    let res = this.eval(test) === 0;
    if(res) this.logError(`Assert: ${this.checkString(this.eval(msg))}`);
  }

  private dirArch(name: string): void {
    if(this.flowStack.length > 1) this.logError("Cannot use .arch within .if or .repeat-statement");
    if(this.blockStack.length > 0) this.logError("Cannot use .arch within macro");
    // must be valid, as parsing would have failed otherwise
    this.includeStack.at(-1)!.arch = parseArchitecture(name);
  }
}
