import { Directive } from "./directives.js";
import { ExpressionHandler, ExpressionResult } from "./expressionhandler.js";
import { ExpressionNode } from "./expressionparser.js";
import { Line, LineType } from "./lineparser.js";
import { ReadHandler } from "./readhandler.js";

type IncludeItem = {
  path: string,
  line: number,
  offset: number,
  isMacro: boolean
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
  varName?: string,
  line: number,
  includeItem: IncludeItem
});

type Label = {
  value: ExpressionResult,
  defined: boolean,
  redefinable: boolean
};

export class Assembler {

  private readHandler = new ReadHandler(this);
  private expressionHandler = new ExpressionHandler(this);

  private includeStack: IncludeItem[] = [];
  private flowStack: FlowItem[] = [];

  private labels: Map<string, Label> = new Map();
  private scope = "";
  private globalLabel?: string;

  private labelsChanged = false;
  private passError?: string;
  private passNum = 0;

  private pc = 0;
  private fillByte = 0;

  constructor() {

  }

  // assemble using given arguments, returns if it succeeded
  assemble(): boolean {
    // TODO: configurable pass limit
    while(this.passNum < 10) {
      this.doPass();
      if(!this.labelsChanged) break;
    }
    if(this.labelsChanged) {
      // force this error above other errors
      this.passError = "Pass limit reached";
    }
    if(this.passError) {
      // error in last pass
      console.error(this.passError);
      return false;
    }
    // succesfull assembly, write output
    return true;
  }

  private doPass(): void {
    this.includeStack = [];
    this.flowStack = [{type: FlowType.MAIN, active: true, taken: true}];

    for(let [_, val] of this.labels) val.defined = false;
    this.scope = "";
    this.globalLabel = undefined;

    this.labelsChanged = false;
    this.passError = undefined;

    this.pc = 0;
    this.fillByte = 0;
    
    this.handleFile("testing/test.s");

    this.passNum++;
  }

  private handleFile(path: string): void {
    // TODO: limit on stack size (for recursive includes etc) (also for macros)
    let parsed = this.readHandler.readAssemblyFile(path);
    this.includeStack.push({path, line: 1, offset: 1, isMacro: false});
    this.handleLines(parsed);
    this.includeStack.pop();
  }

  private handleLines(lines: Line[]): void {
    let includeItem = this.includeStack.at(-1)!;
    while(true) {
      let i = includeItem.line - includeItem.offset;
      if(i >= lines.length) break;
      let line = lines[i]!;
      // handle line
      let flowItem = this.flowStack.at(-1)!;
      let active = flowItem.active && flowItem.taken;
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
          break;
        case LineType.MACRO:
          if(!active) break;
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
      // TODO: handle stacktrace (all items in list, first has 'included at')
    } else if(this.includeStack.length > 0) {
      let includeInfo = this.includeStack.at(-1)!;
      error = `${includeInfo.path}:${includeInfo.line} ${msg}`;
      // TODO: handle stacktrace (all but last item in list, first depends on this one's type)
    }
    if(!this.passError) this.passError = error;
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
        if(!current.redefinable && current.value !== value) this.labelsChanged = true; 
        current.value = value;
      }
      current.defined = true;
    } else {
      this.labels.set(name, {value, defined: true, redefinable: reassignment});
      this.labelsChanged = true;
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
    this.logError(`Undefined label '${expandedNames[0]}'`);
    return 0;
  }

  private expandLabelName(label: string): string[] {
    if(label.startsWith("@")) {
      // block label, check if in block and return list to search
      return [""];
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

  private eval(node: ExpressionNode): ExpressionResult {
    return this.expressionHandler.evaluateExpression(node);
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

  // directive handling

  private handleDirective(directive: Directive, args: (ExpressionNode | string)[]): void {
    let flowItem = this.flowStack.at(-1)!;
    let active = flowItem.active && flowItem.taken;

    switch(directive) {
    }
  }
}
