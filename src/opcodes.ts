import { createM6502Map } from "./architectures/m6502.js";
import { createSpc700Map } from "./architectures/spc700.js";
import { createW65816Map } from "./architectures/w65816.js";
import { ExpressionNode, parseExpression } from "./expressionparser.js";
import { ParserError } from "./lineparser.js";

export enum Architecture {
  M6502 = "m6502",
  W65816 = "w65816",
  SPC700 = "spc700"
};

export enum AdrMode {
  IMM8,
  IMM8P,
  IMM16,
  IMM16P,
  IMM816A,
  IMM816I,
  DP,
  DPABS,
  ABS,
  DPABSLONG,
  LONG,
  ABS0,
  ABSK,
  REL8,
  REL8A,
  REL16,
  IMM3PO,
  IMM3P,
  IMM4PO,
  ABS13
};

export enum SpecialOp {
  ABSBIT
};

export type OpcodeInfo = {
  regex: RegExp,
  adrs: AdrMode[],
  vals: (number | number[])[],
  argMap: number[],
  spc?: SpecialOp
};

export type OpcodeMap = {[p: string]: OpcodeInfo[]};

type ArchInfo<K> = {
  arch: K,
  opMap: OpcodeMap
};

const opcodes: {[key in Architecture]: ArchInfo<key>} = {
  [Architecture.M6502]: {arch: Architecture.M6502, opMap: createM6502Map()},
  [Architecture.W65816]: {arch: Architecture.W65816, opMap: createW65816Map()},
  [Architecture.SPC700]: {arch: Architecture.SPC700, opMap: createSpc700Map()}
};

// parse architecture, returns it or throws
export function parseArchitecture(name: string): Architecture {
  let archInfo = (opcodes as {[p: string]: ArchInfo<Architecture>})[name];
  if(!archInfo) throw new ParserError(`Unknown architecture '${name}'`);
  return archInfo.arch;
}

// parse opcode line, giving parsed expressions and which adressing mode index it is
export function parseOpcode(arch: Architecture, opcode: string, argument: string): [ExpressionNode[], number] {
  let tests = opcodes[arch].opMap[opcode];
  if(!tests) throw new ParserError(`Unknown opcode '${opcode}'`);
  for(let i = 0; i < tests.length; i++) {
    let test = tests[i]!;
    let result = argument.match(test.regex);
    if(result) {
      let args: ExpressionNode[] = [];
      for(let i = 0; i < test.adrs.length; i++) {
        let [node, rest] = parseExpression(result[i + 1]!);
        if(rest.length > 0) throw new ParserError("Trailing characters after expression");
        args.push(node);
      }
      return [args, i];
    }
  }
  throw new ParserError(`Unknown adressing mode for opcode ${opcode}`);
}

// get opcode info for given arch/opcode/addressing mode index, assuming they are valid
export function getOpcodeInfo(arch: Architecture, opcode: string, modeNum: number): OpcodeInfo {
  return opcodes[arch].opMap[opcode]![modeNum]!;
}

// add item to opcode map for given opcode (adding to array if already existing)
export function addItem(map: OpcodeMap, name: string, item: OpcodeInfo): void {
  if(map[name] === undefined) {
    map[name] = [];
  }
  map[name]!.push(item);
}
