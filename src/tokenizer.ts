import { twoCharOps } from "./expressionparser.js";
import { ParserError } from "./lineparser.js";

export enum TokenType {
  NUMBER,
  STRING,
  CHAR,
  LABEL,
  OTHER,
  EOF
};

export type Token = {
  type: TokenType,
  raw: string
} & ({
  type: TokenType.LABEL | TokenType.OTHER | TokenType.EOF
} | {
  type: TokenType.NUMBER,
  value: number
} | {
  type: TokenType.STRING | TokenType.CHAR,
  value: string
});

export const eofToken: Token = {type: TokenType.EOF, raw: "\n"};

// tokenize a string into a list of tokens, ending with an EOF-token (handling comments)
export function tokenize(input: string): Token[] {
  let tokens: Token[] = [];
  while(true) {
    input = consumeSpaces(input);
    // test for comment or line end
    if(input.startsWith(";") || input.length === 0) {
      break;
    }
    // test for string
    let stringTest = input.match(/^"((?:[^\\"]|\\[^u]|\\u\{[\da-fA-F]+\})*)"/);
    if(stringTest) {
      tokens.push({type: TokenType.STRING, raw: stringTest[0], value: handleStringEscapes(stringTest[1]!)});
      input = input.slice(stringTest[0].length);
      continue;
    }
    // test for character constant
    let charTest = input.match(/^'([^\\"]|\\[^u]|\\u\{[\da-fA-F]+\})'/);
    if(charTest) {
      tokens.push({type: TokenType.CHAR, raw: charTest[0], value: handleStringEscapes(charTest[1]!)});
      input = input.slice(charTest[0].length);
      continue;
    }
    // test for numeric constant
    let numberTest = input.match(/^(?:\$[A-Fa-f\d]+|%[01]+|\d+)/);
    if(numberTest) {
      tokens.push({type: TokenType.NUMBER, raw: numberTest[0], value: parseNumber(numberTest[0])});
      input = input.slice(numberTest[0].length);
      continue;
    }
    // test for label
    let labelTest = input.match(/^[\w@\.:]+/);
    if(labelTest) {
      tokens.push({type: TokenType.LABEL, raw: labelTest[0]});
      input = input.slice(labelTest[0].length);
      continue;
    }
    // test for 2-char operator
    if(twoCharOps.includes(input.slice(0, 2))) {
      tokens.push({type: TokenType.OTHER, raw: input.slice(0, 2)});
      input = input.slice(2);
      continue;
    }
    // others are one-char
    tokens.push({type: TokenType.OTHER, raw: input.slice(0, 1)});
    input = input.slice(1);
  }
  tokens.push(eofToken);
  return tokens;
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
          pos++; // skip '{'
          let num = "";
          while(chars[pos] !== "}") {
            num += chars[pos++];
          }
          pos++; // skip '}'
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

// consume all space-characters at the start of the string, optionally throwing if none were found
export function consumeSpaces(expr: string, required = false): string {
  let spaceTest = expr.match(/^\s*/);
  if(required && spaceTest![0].length === 0) throw new ParserError("Expected space after opcode, directive or macro");
  return expr.slice(spaceTest![0].length);
}
