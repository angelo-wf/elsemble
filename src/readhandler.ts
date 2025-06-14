import fs from "node:fs";
import { Line, LineType, parseLine, ParserError } from "./lineparser.js";
import { Assembler } from "./assembler.js";
import { Architecture, parseArchitecture } from "./opcodes.js";
import { Directive } from "./directives.js";

export class ReadHandler {

  private assembler: Assembler;

  private parserCache: Map<string, Line[]> = new Map();
  private binaryCache: Map<string, Uint8Array> = new Map();

  constructor(assembler: Assembler) {
    this.assembler = assembler;
  }

  // read file at path as binary file (with cache)
  readBinaryFile(path: string): Uint8Array {
    if(this.binaryCache.has(path)) {
      return this.binaryCache.get(path)!;
    }
    let arr: Uint8Array;
    try {
      let data = fs.readFileSync(path);
      arr = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } catch(e) {
      this.assembler.logError(`Failed to read file '${path}'`);
      return new Uint8Array(0);
    }
    this.binaryCache.set(path, arr);
    return arr;
  }

  // read and parse assembly file (with cache)
  readAssemblyFile(path: string, arch?: Architecture): Line[] {
    if(this.parserCache.has(path)) {
      return this.parserCache.get(path)!;
    }
    let data: string;
    try {
      data = fs.readFileSync(path, "utf-8");
      data = data.replaceAll("\r", "");
    } catch(e) {
      this.assembler.logError(`Failed to read file '${path}'`);
      return [];
    }
    // parse the data
    let parsed = this.parseAssemblyFile(data, path, arch);
    this.parserCache.set(path, parsed);
    return parsed;
  }

  private parseAssemblyFile(content: string, path: string, arch?: Architecture): Line[] {
    let output: Line[] = [];
    let lineNum = 1;
    try {
      for(let line of content.split("\n")) {
        let parsed = parseLine(line, arch);
        output.push(parsed);
        // handle arch, has to be done during parsing as opcode parsing depends on it
        if(parsed.type === LineType.DIRECTIVE && parsed.directive === Directive.ARCH) {
          arch = parseArchitecture(parsed.arguments[0] as string);
        }
        lineNum++;
      }
      return output;
    } catch(e) {
      if(e instanceof ParserError) {
        this.assembler.logError(e.message, [path, lineNum]);
        return [];
      } else {
        throw e;
      }
    }
  }
}
