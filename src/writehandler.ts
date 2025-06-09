import fs from "node:fs";
import { Assembler } from "./assembler.js";

type LogItem = {
  pc: number,
  pos: number,
  raw: string
};

export class WriteHandler {

  assembler: Assembler;

  output: number[] = [];
  log: LogItem[] = [];

  constructor(assembler: Assembler) {
    this.assembler = assembler;
  }

  startPass(): void {
    this.output = [];
    this.log = [];
  }

  startLine(pc: number, raw: string): void {
    this.log.push({pc, pos: this.output.length, raw});
  }

  writeFiles(): void {
    let data = new Uint8Array(this.output);
    this.writeFile("testing/test.bin", data);
    this.writeFile("testing/test.lst", this.generateListing());
    this.writeFile("testing/test.sym", this.generateSymbolFile());
  }

  private writeFile(path: string, data: Uint8Array | string): void {
    try {
      if(typeof data === "string") {
        fs.writeFileSync(path, data, "utf-8");
      } else {
        fs.writeFileSync(path, data);
      }
    } catch(e) {
      this.assembler.logError(`Failed to write file '${path}'`);
    }
  }

  writeByteTimes(byte: number, count: number): void {
    for(let i = 0; i < count; i++) {
      this.output.push(byte & 0xff);
    }
  }

  writeBytes(...bytes: number[]): void {
    for(let byte of bytes) {
      this.output.push(byte & 0xff);
    }
  }

  writeWords(...words: number[]): void {
    for(let word of words) {
      this.output.push(word & 0xff);
      this.output.push((word >> 8) & 0xff);
    }
  }

  writeLongs(...longs: number[]): void {
    for(let long of longs) {
      this.output.push(long & 0xff);
      this.output.push((long >> 8) & 0xff);
      this.output.push((long >> 16) & 0xff);
    }
  }

  private generateListing(): string {
    let output = "";
    for(let i = 0; i < this.log.length; i++) {
      let logItem = this.log[i]!;
      // get next position and bytes to show (max 4)
      let nextPos = i < this.log.length - 1 ? this.log[i + 1]!.pos : this.output.length;
      let count = nextPos - logItem.pos;
      let more = false;
      if(count > 4) {
        count = 4;
        more = true;
      }
      // get string of bytes
      let byteString = "";
      for(let j = 0; j < count; j++) {
        byteString += `${this.getListingByte(this.output[logItem.pos + j]!)} `;
      }
      if(more) byteString += "+";
      // add to log
      output += `${this.getListingPc(logItem.pc)} ${this.getListingString(byteString)} ${logItem.raw}\n`;
    }
    return output;
  }

  private getListingPc(pc: number): string {
    return ("       " + pc.toString(16)).slice(-8);
  }

  private getListingByte(byte: number): string {
    return ("0" + byte.toString(16)).slice(-2);
  }

  private getListingString(str: string): string {
    return (str + "              ").slice(0, 14);
  }

  private generateSymbolFile(): string {
    let out = "";
    for(let [name, val] of this.assembler.getSymbols()) {
      let valStr = typeof val === "string" ? `"${this.escapeString(val)}"` : `$${val.toString(16)}`;
      out += `${name} = ${valStr}\n`;
    }
    return out;
  }

  private escapeString(str: string): string  {
    let out = "";
    for(let char of [...str]) {
      switch(char) {
        case "\n": out += "\\n"; break;
        case "\r": out += "\\r"; break;
        case "\t": out += "\\t"; break;
        case "\"": out += "\\\""; break;
        case "'": out += "\\'"; break;
        case "\\": out += "\\\\"; break;
        default: out += char;
      }
    }
    return out;
  }
}
