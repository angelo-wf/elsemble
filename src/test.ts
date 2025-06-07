import { ExpressionNode, NodeType, parseExpression } from "./expressionparser.js";
import { Line, LineType, parseLine } from "./lineparser.js";

function test(vals: number[]): void {
  console.log(parseLine("test: lda (2 + +',' | 3 & &6, x) ; g"));
}

test([]);
