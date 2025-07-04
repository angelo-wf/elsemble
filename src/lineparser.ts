import { Directive, parseDirectiveLine } from "./directives.js";
import { ExpressionNode, parseExpression } from "./expressionparser.js";
import { Architecture, parseOpcode } from "./opcodes.js";
import { consumeSpaces, eofToken, Token, tokenize, TokenType } from "./tokenizer.js";

export class ParserError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export enum LineType {
  NONE,
  ASSIGNMENT,
  OPCODE,
  DIRECTIVE,
  MACRO
};

export type Line = {
  type: LineType,
  label?: string,
  raw: string
} & ({
  type: LineType.NONE
} | {
  type: LineType.ASSIGNMENT,
  label: string,
  reassignment: boolean,
  value: ExpressionNode
} | {
  type: LineType.OPCODE,
  opcode: string,
  modeNum: number,
  arguments: ExpressionNode[],
  arch: Architecture
} | {
  type: LineType.DIRECTIVE,
  directive: Directive,
  arguments: ExpressionNode[]
} | {
  type: LineType.MACRO,
  macro: string,
  arguments: ExpressionNode[]
});

// parse a line of assembly
export function parseLine(line: string, arch?: Architecture): Line {
  let raw = line;
  // test for assignment
  let assignmentTest = line.match(/^\s*((?:[\w\.@]|:[\w\.@])+)\s*(:?=)/);
  if(assignmentTest) {
    let [match, assigned, op] = assignmentTest;
    let reassignment = op === ":=";
    // parse expression for value and check that line ends after
    let [value, lineLeft] = parseExpression(tokenize(line.slice(match.length)));
    if(lineLeft[0]!.type !== TokenType.EOF) throw new ParserError("Trailing characters after expression");
    return {type: LineType.ASSIGNMENT, label: checkLabel(assigned!), reassignment, value, raw};
  }
  // check for and get label
  let label: string | undefined = undefined;
  let labelTest = line.match(/^\s*((?:[\w\.@]|:[\w\.@])+):/);
  if(labelTest) {
    label = checkLabel(labelTest[1]!);
    line = line.slice(labelTest[0].length);
  }
  // check for directive or macro
  let dirTest = line.match(/^\s*([\.!]\w[\w\.]*)/);
  if(dirTest) {
    let directive = dirTest[1]!;
    let argumentStr = line.slice(dirTest[0].length);
    if(directive.startsWith("!")) {
      let args: ExpressionNode[] = [];
      if(!checkLineEnd(argumentStr)) {
        // check for required space after it
        argumentStr = consumeSpaces(argumentStr, true);
        let tokensLeft: Token[] = [];
        [args, tokensLeft] = parseArgumentList(tokenize(argumentStr));
        if(tokensLeft[0]!.type !== TokenType.EOF) throw new ParserError("Trailing characters after expression");
      }
      return {type: LineType.MACRO, label, macro: directive.slice(1), arguments: args, raw};
    } else {
      let [args, dir] = parseDirectiveLine(directive.slice(1).toLowerCase(), argumentStr);
      return {type: LineType.DIRECTIVE, label, directive: dir, arguments: args, raw};
    }
  }
  // check for opcode
  let opcodeTest = line.match(/^\s*(\w[\w\.]*)/);
  if(opcodeTest) {
    let opcode = opcodeTest[1]!.toLowerCase();
    let argString = line.slice(opcodeTest[0].length);
    let argumentTokens: Token[];
    if(checkLineEnd(argString)) {
      argumentTokens = [eofToken];
    } else {
      // check for space after opcode
      argString = consumeSpaces(argString, true);
      argumentTokens = tokenize(argString);
    }
    if(!arch) throw new ParserError("Opcode encuntered without architecture set");
    let [args, modeNum] = parseOpcode(arch, opcode, argumentTokens);
    return {type: LineType.OPCODE, label, opcode, arguments: args, modeNum, arch, raw};
  }
  // check if it is empty
  if(checkLineEnd(line)) {
    return {type: LineType.NONE, label, raw};
  }
  throw new ParserError("Unparseable line");
}

// parse a list of expressions split by commas, returning a list of nodes and the remaining string (spaces consumed)
export function parseArgumentList(line: Token[]): [ExpressionNode[], Token[]] {
  let expectComma = false;
  let args: ExpressionNode[] = [];
  while(true) {
    if(expectComma) {
      if(line[0]!.raw !== ",") {
        // no comma, must be end of argument list
        return [args, line];
      }
      line = line.slice(1);
      expectComma = false;
    } else {
      let arg: ExpressionNode;
      [arg, line] = parseExpression(line);
      args.push(arg);
      expectComma = true;
    }
  }
}

// checks if a label is valid, returns it if so, else throws
export function checkLabel(label: string): string {
  // check for block-label (@b)
  let blockLabelTest = label.match(/^@[A-Za-z_]\w*$/);
  if(blockLabelTest) {
    return label;
  }
  // check for other labels (.l, g, g.l, :g, :g.l, s:g, s:g.l)
  let otherLabelTest = label.match(/^(?:([A-Za-z_]\w*)?:)?([A-Za-z_]\w*)?(?:\.([A-Za-z_]\w*))?$/);
  if(otherLabelTest && label.length > 0) {
    let [_, scope, global, local] = otherLabelTest;
    if(scope || label.startsWith(":")) {
      if(!global && local) throw new ParserError(`Invalid label '${label}'`);
    }
    return label;
  }
  throw new ParserError(`Invalid label '${label}'`);
}

// check for comment or end of line
export function checkLineEnd(line: string): boolean {
  line = consumeSpaces(line);
  if(line.length > 0 && !line.startsWith(";")) {
    return false;
  }
  return true;
}
