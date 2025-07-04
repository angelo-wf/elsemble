import { Assembler } from "./assembler.js";
import { BinaryOperator, ExpressionNode, NodeType, UnaryOperator } from "./expressionparser.js";

export type ExpressionResult = number | string;

export class ExpressionHandler {

  private assembler: Assembler;

  constructor(assembler: Assembler) {
    this.assembler = assembler;
  }

  evaluateExpression(node: ExpressionNode): ExpressionResult {
    switch(node.type) {
      case NodeType.ROOT: return this.evaluateExpression(node.right!); // should never happen
      case NodeType.VALUE: return node.value;
      case NodeType.CHAR: return this.assembler.mapCharacter(node.char);
      case NodeType.SUBEXPR: return this.evaluateExpression(node.expression);
      case NodeType.PC: return this.assembler.getPc();
      case NodeType.LABEL: return this.assembler.getLabelValue(node.label);
      case NodeType.UNARY: return this.handleUnaryOperator(node.operator, node.right!);
      case NodeType.BINARY: return this.handleBinaryOperator(node.operator, node.left!, node.right!);
      default: throw (node satisfies never);
    }
  }

  private handleUnaryOperator(operator: UnaryOperator, node: ExpressionNode): ExpressionResult {
    let value = this.evaluateExpression(node);
    switch(operator) {
      case UnaryOperator.INVERT: return ~this.assembler.checkNumber(value);
      case UnaryOperator.NOT: return value === 0 ? 1 : 0;
      case UnaryOperator.LOGIC: return value === 0 ? 0 : 1;
      case UnaryOperator.NEGATE: return -this.assembler.checkNumber(value);
      case UnaryOperator.NOP: return value;
      case UnaryOperator.LOBYTE: return this.assembler.checkNumber(value) & 0xff;
      case UnaryOperator.HIBYTE: return (this.assembler.checkNumber(value) >> 8) & 0xff;
      case UnaryOperator.BANK: return (this.assembler.checkNumber(value) >> 16) & 0xff;
      case UnaryOperator.LOWORD: return this.assembler.checkNumber(value) & 0xffff;
      default: throw (operator satisfies never);
    }
  }

  private handleBinaryOperator(operator: BinaryOperator, left: ExpressionNode, right: ExpressionNode): ExpressionResult {
    let leftVal = this.evaluateExpression(left);
    let rightVal = this.evaluateExpression(right);
    switch(operator) {
      case BinaryOperator.MULTIPLY: return this.calcNumeric(leftVal, rightVal, (a, b) => a * b);
      case BinaryOperator.DIVIDE: return this.calcNumeric(leftVal, rightVal, (a, b) => this.handleDivMod(a, b, false));
      case BinaryOperator.MODULUS: return this.calcNumeric(leftVal, rightVal, (a, b) => this.handleDivMod(a, b, true));
      case BinaryOperator.ADD: return this.handleAddition(leftVal, rightVal);
      case BinaryOperator.SUBTRACT: return this.calcNumeric(leftVal, rightVal, (a, b) => a - b);
      case BinaryOperator.LSHIFT: return this.calcNumeric(leftVal, rightVal, (a, b) => this.handleShift(a, b, false));
      case BinaryOperator.RSHIFT: return this.calcNumeric(leftVal, rightVal, (a, b) => this.handleShift(a, b, true));
      case BinaryOperator.AND: return this.calcNumeric(leftVal, rightVal, (a, b) => a & b);
      case BinaryOperator.OR: return this.calcNumeric(leftVal, rightVal, (a, b) => a | b);
      case BinaryOperator.XOR: return this.calcNumeric(leftVal, rightVal, (a, b) => a ^ b);
      case BinaryOperator.LT: return this.calcNumeric(leftVal, rightVal, (a, b) => (a < b) ? 1 : 0);
      case BinaryOperator.LTE: return this.calcNumeric(leftVal, rightVal, (a, b) => (a <= b) ? 1 : 0);
      case BinaryOperator.GT: return this.calcNumeric(leftVal, rightVal, (a, b) => (a > b) ? 1 : 0);
      case BinaryOperator.GTE: return this.calcNumeric(leftVal, rightVal, (a, b) => (a >= b) ? 1 : 0);
      case BinaryOperator.EQ: return (leftVal === rightVal) ? 1 : 0;
      case BinaryOperator.NEQ: return (leftVal !== rightVal) ? 1 : 0;
      case BinaryOperator.LAND: return (leftVal === 0 ? 0 : 1) && (rightVal === 0 ? 0 : 1);
      case BinaryOperator.LOR: return (leftVal === 0 ? 0 : 1) || (rightVal === 0 ? 0 : 1);
      case BinaryOperator.LXOR: return (leftVal === 0 ? 0 : 1) ^ (rightVal === 0 ? 0 : 1);
      default: throw (operator satisfies never);
    }
  }

  private calcNumeric(left: ExpressionResult, right: ExpressionResult, func: (l: number, r: number) => number): number {
    return func(this.assembler.checkNumber(left), this.assembler.checkNumber(right));
  }

  private handleAddition(left: ExpressionResult, right: ExpressionResult): ExpressionResult {
    if(typeof left === "string" && typeof right === "string") return left + right;
    if(typeof left === "number" && typeof right === "number") return left + right;
    this.assembler.logError("Cannot use addition between string and number");
    return 0;
  }

  private handleDivMod(left: number, right: number, mod: boolean): number {
    if(right === 0) {
      this.assembler.logError("Division or mod by 0");
      return 0;
    }
    return mod ? left % right : Math.trunc(left / right);
  }

  private handleShift(left: number, right: number, shiftRight: boolean): number {
    if(right < 0) {
      this.assembler.logError("Shift by negative value");
      return 0;
    }
    return shiftRight ? left >> right : left << right; 
  }
}
