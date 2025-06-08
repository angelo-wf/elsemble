import { Assembler } from "./assembler.js";
import { ExpressionNode, NodeType, parseExpression } from "./expressionparser.js";
import { Line, LineType, parseLine } from "./lineparser.js";
import { ReadHandler } from "./readhandler.js";

function test(): void {
  let assembler = new Assembler();
  assembler.assemble();
}

test();
