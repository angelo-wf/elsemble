import { consumeSpaces, ExpressionNode, parseExpression } from "./expressionparser.js";
import { checkLineEnd, ParserError } from "./lineparser.js";

export enum Directive {
  IF = "if",
  ENDIF = "endif",
  MACRO = "macro",
  DB = "db",
  INCBIN = "incbin",
  ASIZE = "asize",
  REREAT = "repeat"
};

enum ArgumentType {
  EXPR,
  NAME,
  BLOCKLBL
};

type DirectiveInfo<K> = {
  dir: K,
  minCount: number,
  types: ArgumentType[],
  variadicType?: ArgumentType
};

const directiveArgs: {[key in Directive]: DirectiveInfo<key>} = {
  [Directive.IF]: {dir: Directive.IF, minCount: 1, types: [ArgumentType.EXPR]},
  [Directive.ENDIF]: {dir: Directive.ENDIF, minCount: 0, types: []},
  [Directive.MACRO]: {dir: Directive.MACRO, minCount: 1, types: [ArgumentType.NAME], variadicType: ArgumentType.BLOCKLBL},
  [Directive.DB]: {dir: Directive.DB, minCount: 1, types: [ArgumentType.EXPR], variadicType: ArgumentType.EXPR},
  [Directive.INCBIN]: {dir: Directive.INCBIN, minCount: 1, types: [ArgumentType.EXPR, ArgumentType.EXPR, ArgumentType.EXPR]},
  [Directive.ASIZE]: {dir: Directive.ASIZE, minCount: 1, types: [ArgumentType.EXPR]},
  [Directive.REREAT]: {dir: Directive.REREAT, minCount: 1, types: [ArgumentType.EXPR, ArgumentType.BLOCKLBL]}
};

// parse a directive line, giving the directive and list of arguments (type depends on specifief type for directive)
export function parseDirectiveLine(directive: string, line: string): [(ExpressionNode | string)[], Directive] {
  let info = (directiveArgs as {[p: string]: DirectiveInfo<Directive>})[directive];
  if(!info) {
    throw new ParserError(`Unknown directive '.${directive}'`);
  }
  let dir = info.dir;
  if(checkLineEnd(line)) {
    if(info.minCount > 0) throw new ParserError("Too few arguments");
    return [[], dir];
  }
  // parse arguments
  let expectComma = false;
  let args: (ExpressionNode | string)[] = [];
  while(true) {
    line = consumeSpaces(line);
    if(expectComma) {
      if(!line.startsWith(",")) {
        // no comma, must be end of argument list
        break;
      }
      line = line.slice(1);
      expectComma = false;
    } else {
      // get next type
      let type = args.length >= info.types.length ? info.variadicType : info.types[args.length];
      if(type === undefined) throw new ParserError("Too many arguments");
      let arg: ExpressionNode | string;
      // and parse it
      switch(type) {
        case ArgumentType.EXPR: [arg, line] = parseExpression(line); break;
        case ArgumentType.NAME: [arg, line] = parseNonExprArg(line, false); break;
        case ArgumentType.BLOCKLBL: [arg, line] = parseNonExprArg(line, true); break;
        default: throw (type satisfies never);
      }
      args.push(arg);
      expectComma = true;
    }
  }
  // check for line end after
  if(!checkLineEnd(line)) throw new ParserError("Trailing characters after expression");
  if(args.length < info.minCount) throw new ParserError("Too few arguments");
  return [args, dir];
}

function parseNonExprArg(line: string, isBlockLabel: boolean): [out: string, line: string] {
  let test = line.match(isBlockLabel ? /^@[A-Za-z_]\w*/ : /^[A-Za-z_]\w*/);
  if(test) {
    return [test[0], line.slice(test[0].length)];
  }
  throw new ParserError(`Expected ${isBlockLabel ? "block label" : "name"} as argument`);
}
