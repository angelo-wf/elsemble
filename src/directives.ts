import { ExpressionNode } from "./expressionparser.js";
import { checkLineEnd, parseArgumentList, ParserError } from "./lineparser.js";
import { consumeSpaces, tokenize, TokenType } from "./tokenizer.js";

export enum Directive {
  IF = "if",
  IFDEF = "ifdef",
  IFNDEF = "ifndef",
  ELIF = "elif",
  ELSE = "else",
  ENDIF = "endif",
  REREAT = "repeat",
  ENDREPEAT = "endrepeat",
  MACRO = "macro",
  ENDMACRO = "endmacro",
  INCLUDE = "include",
  ORG = "org",
  FILLBYTE = "fillbyte",
  PAD = "pad",
  FILL = "fill",
  ALIGN = "align",
  RPAD = "rpad",
  RES = "res",
  RALIGN = "ralign",
  DB = "db",
  DW = "dw",
  DL = "dl",
  DLB = "dlb",
  DHB = "dhb",
  DBB = "dbb",
  DLW = "dlw",
  INCBIN = "incbin",
  SCOPE = "scope",
  ENDSCOPE = "endscope",
  ASSERT = "assert",
  CHARMAP = "charmap",
  CLRCHARMAP = "clrcharmap",
  ARCH = "arch",
  DIRPAGE = "dirpage",
  BANK = "bank",
  ASIZE = "asize",
  ISIZE = "isize",
  MIRROR = "mirror",
  CLRMIRROR = "clrmirror",
  SMART = "smart"
};

type DirectiveInfo<K> = {
  dir: K,
  minCount: number,
  maxCount?: number
};

const directiveArgs: {[key in Directive]: DirectiveInfo<key>} = {
  [Directive.IF]: {dir: Directive.IF, minCount: 1, maxCount: 1},
  [Directive.IFDEF]: {dir: Directive.IFDEF, minCount: 1, maxCount: 1},
  [Directive.IFNDEF]: {dir: Directive.IFNDEF, minCount: 1, maxCount: 1},
  [Directive.ELIF]: {dir: Directive.ELIF, minCount: 1, maxCount: 1},
  [Directive.ELSE]: {dir: Directive.ELSE, minCount: 0, maxCount: 0},
  [Directive.ENDIF]: {dir: Directive.ENDIF, minCount: 0, maxCount: 0},
  [Directive.REREAT]: {dir: Directive.REREAT, minCount: 1, maxCount: 2},
  [Directive.ENDREPEAT]: {dir: Directive.ENDREPEAT, minCount: 0, maxCount: 0},
  [Directive.MACRO]: {dir: Directive.MACRO, minCount: 1},
  [Directive.ENDMACRO]: {dir: Directive.ENDMACRO, minCount: 0, maxCount: 0},
  [Directive.INCLUDE]: {dir: Directive.INCLUDE, minCount: 1, maxCount: 1},
  [Directive.ORG]: {dir: Directive.ORG, minCount: 1, maxCount: 1},
  [Directive.FILLBYTE]: {dir: Directive.FILLBYTE, minCount: 1, maxCount: 1},
  [Directive.PAD]: {dir: Directive.PAD, minCount: 1, maxCount: 2},
  [Directive.FILL]: {dir: Directive.FILL, minCount: 1, maxCount: 2},
  [Directive.ALIGN]: {dir: Directive.ALIGN, minCount: 1, maxCount: 2},
  [Directive.RPAD]: {dir: Directive.RPAD, minCount: 1, maxCount: 1},
  [Directive.RES]: {dir: Directive.RES, minCount: 1, maxCount: 1},
  [Directive.RALIGN]: {dir: Directive.RALIGN, minCount: 1, maxCount: 1},
  [Directive.DB]: {dir: Directive.DB, minCount: 1},
  [Directive.DW]: {dir: Directive.DW, minCount: 1},
  [Directive.DL]: {dir: Directive.DL, minCount: 1},
  [Directive.DLB]: {dir: Directive.DLB, minCount: 1},
  [Directive.DHB]: {dir: Directive.DHB, minCount: 1},
  [Directive.DBB]: {dir: Directive.DBB, minCount: 1},
  [Directive.DLW]: {dir: Directive.DLW, minCount: 1},
  [Directive.INCBIN]: {dir: Directive.INCBIN, minCount: 1, maxCount: 3},
  [Directive.SCOPE]: {dir: Directive.SCOPE, minCount: 1, maxCount: 1},
  [Directive.ENDSCOPE]: {dir: Directive.ENDSCOPE, minCount: 0, maxCount: 0},
  [Directive.ASSERT]: {dir: Directive.ASSERT, minCount: 2, maxCount: 2},
  [Directive.CHARMAP]: {dir:Directive.CHARMAP, minCount: 2, maxCount: 2},
  [Directive.CLRCHARMAP]: {dir: Directive.CLRCHARMAP, minCount: 0, maxCount: 0},
  [Directive.ARCH]: {dir: Directive.ARCH, minCount: 1, maxCount: 1},
  [Directive.DIRPAGE]: {dir: Directive.DIRPAGE, minCount: 1, maxCount: 1},
  [Directive.BANK]: {dir: Directive.BANK, minCount: 1, maxCount: 1},
  [Directive.ASIZE]: {dir: Directive.ASIZE, minCount: 1, maxCount: 1},
  [Directive.ISIZE]: {dir: Directive.ISIZE, minCount: 1, maxCount: 1},
  [Directive.MIRROR]: {dir: Directive.MIRROR, minCount: 4, maxCount: 5},
  [Directive.CLRMIRROR]: {dir: Directive.CLRMIRROR, minCount: 0, maxCount: 0},
  [Directive.SMART]: {dir: Directive.SMART, minCount: 1, maxCount: 1}
};

// parse a directive line, giving the directive and list of arguments
export function parseDirectiveLine(directive: string, line: string): [ExpressionNode[], Directive] {
  let info = (directiveArgs as {[p: string]: DirectiveInfo<Directive>})[directive];
  if(!info) {
    throw new ParserError(`Unknown directive '.${directive}'`);
  }
  let dir = info.dir;
  if(checkLineEnd(line)) {
    if(info.minCount > 0) throw new ParserError("Too few arguments");
    return [[], dir];
  }
  // check for required space after it
  line = consumeSpaces(line, true);
  // parse arguments
  let [args, tokensLeft] = parseArgumentList(tokenize(line));
  // check for line end after
  if(tokensLeft[0]!.type !== TokenType.EOF) throw new ParserError("Trailing characters after expression");
  if(info.maxCount !== undefined && args.length > info.maxCount) throw new ParserError("Too many arguments");
  if(args.length < info.minCount) throw new ParserError("Too few arguments");
  return [args, dir];
}
