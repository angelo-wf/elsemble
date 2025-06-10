import { ExpressionNode, parseExpression } from "./expressionparser.js";
import { ParserError } from "./lineparser.js";

export enum Architecture {
  M6502 = "m6502",
  W65816 = "w65816"
};

export enum AdrMode {
  IMM8
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

type ArchInfo<K> = {
  arch: K,
  opMap: {[p: string]: OpcodeInfo[]}
};

// TODO: some temp content used for testing
const opcodes: {[key in Architecture]: ArchInfo<key>} = {
  [Architecture.M6502]: {arch: Architecture.M6502, opMap: {"lda": [
    {regex: /^#(.+)$/i, adrs: [AdrMode.IMM8], vals: [0xa9], argMap: [-1, 1]},
    {regex: /^(.+),#(.+)$/i, adrs: [AdrMode.IMM8, AdrMode.IMM8], vals: [0xa5], argMap: [-1, 2, 1]}
  ]}},
  [Architecture.W65816]: {arch: Architecture.W65816, opMap: {}}
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
