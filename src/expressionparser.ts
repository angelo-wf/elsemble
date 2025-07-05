import { checkLabel, ParserError } from "./lineparser.js";
import { Token, TokenType } from "./tokenizer.js";

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
  LOGIC = "?",
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
  [UnaryOperator.LOGIC]: {op: UnaryOperator.LOGIC, level: 0},
  [UnaryOperator.NOP]: {op: UnaryOperator.NOP, level: 0},
  [UnaryOperator.NEGATE]: {op: UnaryOperator.NEGATE, level: 0},
  [UnaryOperator.LOBYTE]: {op: UnaryOperator.LOBYTE, level: 0},
  [UnaryOperator.HIBYTE]: {op: UnaryOperator.HIBYTE, level: 0},
  [UnaryOperator.BANK]: {op: UnaryOperator.BANK, level: 0},
  [UnaryOperator.LOWORD]: {op: UnaryOperator.LOWORD, level: 0}
};

export const twoCharOps = Object.values(BinaryOperator).filter(v => v.length > 1) as string[];

export enum NodeType {
  ROOT,
  BINARY,
  UNARY,
  VALUE,
  CHAR,
  SUBEXPR,
  PC,
  LABEL,
  BLOCKLABEL,
  NAMELABEL
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
  type: NodeType.LABEL | NodeType.NAMELABEL | NodeType.BLOCKLABEL,
  label: string
} | {
  type: NodeType.PC
});

// parse a expression from a token array, returning the parsed node tree and the remaining tokens
export function parseExpression(expr: Token[]): [ExpressionNode, Token[]] {
  let node: ExpressionNode = {type: NodeType.ROOT};
  let root = node;
  let expectBinaryOp = false;
  // keep going until unknown char found for binary operator, which marks the end
  while(true) {
    if(expectBinaryOp) {
      let bop = (binaryOps as {[p: string]: OperatorInfo<BinaryOperator>})[expr[0]!.raw];
      if(!bop) {
        // no operator found, must be end of expression
        return [root.right!, expr];
      }
      expr.shift();
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
      let uop = (UnaryOps as {[p: string]: OperatorInfo<UnaryOperator>})[expr[0]!.raw];
      if(uop) {
        expr.shift();
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

function parseNonOp(expr: Token[]): [ExpressionNode, Token[]] {
  // test for bracketed expression
  if(expr[0]!.raw === "(") {
    expr.shift();
    // parse subexpression, and check that it is followed by closing bracket
    let subExpression: ExpressionNode;
    [subExpression, expr] = parseExpression(expr);
    // Typescript bug? Testing using `if(expr[0]!.raw !== ")")` throws a 'comparison appears to be unintentional'
    // claiming that "(" and ")" have no overlap, despite arr being shifted (and redefined) so arr[0].raw is no longer "("
    // if(expr[0]!.raw !== ")") throw new ParserError("Unclosed parentheses");
    if(expr.shift()!.raw !== ")") throw new ParserError("Unclosed parentheses");
    let newNode: ExpressionNode = {type: NodeType.SUBEXPR, expression: subExpression};
    return [newNode, expr];
  }
  // test for string constant
  if(expr[0]!.type === TokenType.STRING) {
    let newNode: ExpressionNode = {type: NodeType.VALUE, value: expr[0]!.value};
    return [newNode, expr.slice(1)];
  }
  // check for character constant
  if(expr[0]!.type === TokenType.CHAR) {
    let newNode: ExpressionNode = {type: NodeType.CHAR, char: expr[0]!.value};
    return [newNode, expr.slice(1)];
  }
  // check for number literal
  if(expr[0]!.type === TokenType.NUMBER) {
    let newNode: ExpressionNode = {type: NodeType.VALUE, value: expr[0]!.value};
    return [newNode, expr.slice(1)];
  }
  if(expr[0]!.type === TokenType.LABEL) {
    let label = checkLabel(expr[0]!.raw);
    let type = NodeType.LABEL;
    if(label.startsWith("@")){
      type = NodeType.BLOCKLABEL;
    } else if(!label.includes(":") && !label.includes(".")) {
      type = NodeType.NAMELABEL;
    }
    let newNode: ExpressionNode = {type, label};
    return [newNode, expr.slice(1)];
  }
  // check for pc reference
  if(expr[0]!.raw === "*") {
    let newNode: ExpressionNode = {type: NodeType.PC};
    return [newNode, expr.slice(1)];
  }
  throw new ParserError("Truncated or missing expression");
}
