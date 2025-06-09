import { checkLabel, ParserError } from "./lineparser.js";

export enum BinaryOperator {
  MULTIPLY = "*",
  DIVIDE = "/",
  MODULUS = "%",
  ADD = "+",
  SUBTRACT = "-",
  LSHIFT = "<<",
  RSHIFT = ">>",
  AND = "&",
  OR = "|",
  XOR = "^",
  LT = "<",
  LTE = "<=",
  GT = ">",
  GTE = ">=",
  EQ = "==",
  NEQ = "!=",
  LAND = "&&",
  LOR = "||",
  LXOR = "^^"
};

export enum UnaryOperator {
  INVERT = "~",
  NOT = "!",
  NOP = "+",
  NEGATE = "-",
  LOBYTE = "<",
  HIBYTE = ">",
  BANK = "^",
  LOWORD = "&"
};

type OperatorInfo<K> = {
  op: K,
  level: number
};

const binaryOps: {[key in BinaryOperator]: OperatorInfo<key>} = {
  [BinaryOperator.MULTIPLY]: {op: BinaryOperator.MULTIPLY, level: 9},
  [BinaryOperator.DIVIDE]: {op: BinaryOperator.DIVIDE, level: 9},
  [BinaryOperator.MODULUS]: {op: BinaryOperator.MODULUS, level: 9},
  [BinaryOperator.ADD]: {op: BinaryOperator.ADD, level: 8},
  [BinaryOperator.SUBTRACT]: {op: BinaryOperator.SUBTRACT, level: 8},
  [BinaryOperator.LSHIFT]: {op: BinaryOperator.LSHIFT, level: 7},
  [BinaryOperator.RSHIFT]: {op: BinaryOperator.RSHIFT, level: 7},
  [BinaryOperator.AND]: {op: BinaryOperator.AND, level: 6},
  [BinaryOperator.OR]: {op: BinaryOperator.OR, level: 5},
  [BinaryOperator.XOR]: {op: BinaryOperator.XOR, level: 5},
  [BinaryOperator.LT]: {op: BinaryOperator.LT, level: 4},
  [BinaryOperator.LTE]: {op: BinaryOperator.LTE, level: 4},
  [BinaryOperator.GT]: {op: BinaryOperator.GT, level: 4},
  [BinaryOperator.GTE]: {op: BinaryOperator.GTE, level: 4},
  [BinaryOperator.EQ]: {op: BinaryOperator.EQ, level: 3},
  [BinaryOperator.NEQ]: {op: BinaryOperator.NEQ, level: 3},
  [BinaryOperator.LAND]: {op: BinaryOperator.LAND, level: 2},
  [BinaryOperator.LOR]: {op: BinaryOperator.LOR, level: 1},
  [BinaryOperator.LXOR]: {op: BinaryOperator.LXOR, level: 1}
};

const UnaryOps: {[key in UnaryOperator]: OperatorInfo<key>} = {
  [UnaryOperator.INVERT]: {op: UnaryOperator.INVERT, level: 0},
  [UnaryOperator.NOT]: {op: UnaryOperator.NOT, level: 0},
  [UnaryOperator.NOP]: {op: UnaryOperator.NOP, level: 0},
  [UnaryOperator.NEGATE]: {op: UnaryOperator.NEGATE, level: 0},
  [UnaryOperator.LOBYTE]: {op: UnaryOperator.LOBYTE, level: 0},
  [UnaryOperator.HIBYTE]: {op: UnaryOperator.HIBYTE, level: 0},
  [UnaryOperator.BANK]: {op: UnaryOperator.BANK, level: 0},
  [UnaryOperator.LOWORD]: {op: UnaryOperator.LOWORD, level: 0}
};

export enum NodeType {
  ROOT,
  BINARY,
  UNARY,
  VALUE,
  CHAR,
  SUBEXPR,
  PC,
  LABEL
};

export type ExpressionNode = {
  type: NodeType,
  parent?: ExpressionNode,
  right?: ExpressionNode
} & ({
  type: NodeType.ROOT
} | {
  type: NodeType.BINARY,
  operator: BinaryOperator,
  left?: ExpressionNode
} | {
  type: NodeType.UNARY,
  operator: UnaryOperator
} | {
  type: NodeType.VALUE,
  value: number | string
} | {
  type: NodeType.CHAR,
  char: string
} | {
  type: NodeType.SUBEXPR,
  expression: ExpressionNode
} | {
  type: NodeType.LABEL,
  label: string
} | {
  type: NodeType.PC
});

// parse a expression from a string, returning the parsed node tree and the remaining string (spaces consumed)
export function parseExpression(expr: string): [ExpressionNode, string] {
  let node: ExpressionNode = {type: NodeType.ROOT};
  let root = node;
  let expectBinaryOp = false;
  // keep going until unknown char found for binary operator, which marks the end
  while(true) {
    if(expectBinaryOp) {
      expr = consumeSpaces(expr);
      let bop = (binaryOps as {[p: string]: OperatorInfo<BinaryOperator>})[expr.slice(0, 2)];
      if(!bop) bop = (binaryOps as {[p: string]: OperatorInfo<BinaryOperator>})[expr.slice(0, 1)];
      if(!bop) {
        // no operator found, must be end of expression
        return [root.right!, expr];
      }
      expr = expr.slice(bop.op.length);
      let level = binaryOps[bop.op].level;
      // go up tree until we find root or binary node with lower level
      while(!(node.type === NodeType.ROOT || (node.type === NodeType.BINARY && binaryOps[node.operator].level < level))) {
        node = node.parent!;
      }
      // insert new node there, taking found node's right as our left
      let newNode: ExpressionNode = {type: NodeType.BINARY, operator: bop.op, parent: node, left: node.right};
      node.right!.parent = newNode;
      node.right = newNode;
      node = newNode;
      expectBinaryOp = false;
    } else {
      expr = consumeSpaces(expr);
      let uop = (UnaryOps as {[p: string]: OperatorInfo<UnaryOperator>})[expr.slice(0, 1)];
      if(uop) {
        expr = expr.slice(uop.op.length);
        // put operator in tree
        let newNode: ExpressionNode = {type: NodeType.UNARY, operator: uop.op, parent: node};
        node.right = newNode;
        node = newNode;
      } else {
        // parse out value and switch to expect binary operator
        let newNode: ExpressionNode;
        [newNode, expr] = parseNonOp(expr);
        newNode.parent = node;
        node.right = newNode;
        node = newNode;
        expectBinaryOp = true;
      }
    }
  }
}

function parseNonOp(expr: string): [ExpressionNode, string] {
  // test for bracketed expression
  if(expr.startsWith("(")) {
    expr = expr.slice(1);
    // parse subexpression, and check that it is followed by closing bracket
    let subExpression: ExpressionNode;
    [subExpression, expr] = parseExpression(expr);
    if(!expr.startsWith(")")) throw new ParserError("Unclosed parentheses");
    let newNode: ExpressionNode = {type: NodeType.SUBEXPR, expression: subExpression};
    return [newNode, expr.slice(1)];
  }
  // test for string constant
  let stringTest = expr.match(/^"((?:[^\\"]|\\[^u]|\\u\([\da-fA-F]+\))*)"/);
  if(stringTest) {
    let newNode: ExpressionNode = {type: NodeType.VALUE, value: handleStringEscapes(stringTest[1]!)};
    return [newNode, expr.slice(stringTest[0].length)];
  }
  // check for character constant
  let charTest = expr.match(/^'([^\\"]|\\[^u]|\\u\([\da-fA-F]+\))'/);
  if(charTest) {
    let newNode: ExpressionNode = {type: NodeType.CHAR, char: handleStringEscapes(charTest[1]!)};
    return [newNode, expr.slice(charTest[0].length)];
  }
  // check for number literal
  let numberTest = expr.match(/^(?:\$[A-Fa-f\d]+|%[01]+|\d+)/);
  if(numberTest) {
    let newNode: ExpressionNode = {type: NodeType.VALUE, value: parseNumber(numberTest[0])};
    return [newNode, expr.slice(numberTest[0].length)];
  }
  // check for label
  let labelTest = expr.match(/^[\w@\.:]+/);
  if(labelTest) {
    let newNode: ExpressionNode = {type: NodeType.LABEL, label: checkLabel(labelTest[0])};
    return [newNode, expr.slice(labelTest[0].length)];
  }
  // check for pc reference
  if(expr.startsWith("*")) {
    let newNode: ExpressionNode = {type: NodeType.PC};
    return [newNode, expr.slice(1)];
  }
  throw new ParserError("Truncated or missing expression");
}

// remove unneeded spaces and escape commas in strings, used for opcode parsing, goes until line end or comment
export function cleanExpression(expr: string): string {
  let out = "";
  let last = "";
  while(true) {
    // check for string or character, escape commas
    let stringTest = expr.match(/^"(?:[^\\"]|\\[^u]|\\u\([\da-fA-F]+\))*"/);
    if(stringTest) {
      out += stringTest[0].replaceAll(",", "\\u(2c)");
      expr = expr.slice(stringTest[0].length);
      last = "\"";
      continue;
    }
    let charTest = expr.match(/^'(?:[^\\"]|\\[^u]|\\u\([\da-fA-F]+\))'/);
    if(charTest) {
      out += charTest[0].replaceAll(",", "\\u(2c)");
      expr = expr.slice(charTest[0].length);
      last = "'";
      continue;
    }
    // check if it is a space, if not between signifcant chars, remove
    if(/^\s+/.test(expr)) {
      expr = consumeSpaces(expr);
      if(isSpaceSignificant(last, expr.slice(0, 1))) {
        out += " ";
      }
      last = " ";
      continue;
    }
    // check if we are at end or at a semicolon
    if(expr.length === 0 || expr.startsWith(";")) {
      return out;
    }
    // other chars go through
    out += expr.slice(0, 1);
    last = expr.slice(0, 1);
    expr = expr.slice(1);
  }
}

function isSpaceSignificant(left: string, right: string): boolean {
  // two words/numbers in a row (e.g 'ab cd'), keep the space
  if(/[\w@\.:]/.test(left) && /[\w@\.:]/.test(right)) return true;
  // keep space between chars that disambiguate between 2-char binary op and binary + unary ops
  if(left === "&" && right === "&") return true;
  if(left === "^" && right === "^") return true;
  if(left === "<" && right === "<") return true;
  if(left === ">" && right === ">") return true;
  return false;
}

function parseNumber(num: string): number {
  if(num.startsWith("$")) return parseInt(num.slice(1), 16);
  if(num.startsWith("%")) return parseInt(num.slice(1), 2);
  return parseInt(num, 10);
}

function handleStringEscapes(str: string): string {
  let out = "";
  let chars = [...str];
  let pos = 0;
  while(pos < chars.length) {
    let char = chars[pos++]!;
    if(char === "\\") {
      let second = chars[pos++]!;
      switch(second) {
        case "n": out += "\n"; break;
        case "r": out += "\r"; break;
        case "t": out += "\t"; break;
        case "\"": out += "\""; break;
        case "'": out += "'"; break;
        case "\\": out += "\\"; break;
        case "u":
          pos++; // skip '('
          let num = "";
          while(chars[pos] !== ")") {
            num += chars[pos++];
          }
          pos++; // skip ')'
          out += String.fromCodePoint(parseInt(num, 16));
          break;
        default: throw new ParserError(`Unknown escape character '\\${second}'`);
      }
    } else {
      out += char;
    }
  }
  return out;
}

// consume all space-characters at the start of the string
export function consumeSpaces(expr: string): string {
  let spaceTest = expr.match(/^\s*/);
  return expr.slice(spaceTest![0].length);
}
