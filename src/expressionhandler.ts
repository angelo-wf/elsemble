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
      case NodeType.CHAR: return node.char.codePointAt(0)!; // TODO: use char map
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
      case UnaryOperator.NOT: return this.assembler.checkNumber(value) === 0 ? 1 : 0;
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
    // TODO: implement
    return 0;
  }
}
