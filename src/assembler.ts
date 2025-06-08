import { ExpressionResult } from "./expressionhandler.js";
import { Line } from "./lineparser.js";
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

      if(line.label && active) {

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

  // get result for evaluating label, or 0 if it is not known yet
  getLabelValue(label: string): ExpressionResult {
    let expandedNames = this.expandLabelName(label);
    // try each label to test in order
    for(let name of expandedNames) {
      if(this.labels.has(name)) {
        let label = this.labels.get(name)!;
        // don't allow getting value of redefinable label
        if(label.redefinable && !label.defined) {
          // TODO: print nicer
          this.logError(`Accessed label '${label}' before first definition`);
        }
        return label.value;
      }
    }
    // value not known yet, default to 0
    this.logError(`Undefined label '${label}'`);
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

  // value testing

  // check and turn result into number
  checkNumber(val: ExpressionResult): number {
    if(typeof val === "string") {
      this.logError("Expected number, got string");
      return 0;
    }
    return val;
  }
}
