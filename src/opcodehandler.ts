import { Assembler } from "./assembler.js";
import { ExpressionResult } from "./expressionhandler.js";
import { ExpressionNode } from "./expressionparser.js";
import { AdrMode, Architecture, getOpcodeInfo } from "./opcodes.js";

type ArchConfig = {
  dirPage: number,
  bank: number,
  aSize: number,
  iSize: number,
  memMap: ({min: number, max: number, bank: number} | undefined)[];
};

export class OpcodeHandler {

  private assembler: Assembler;

  private configs: {[key in Architecture]: ArchConfig} = {
    [Architecture.M6502]: {dirPage: 0, bank: 0, aSize: 8, iSize: 8, memMap: []},
    [Architecture.W65816]: {dirPage: 0, bank: 0, aSize: 8, iSize: 8, memMap: []}
  };

  constructor(assembler: Assembler) {
    this.assembler = assembler;
  }

  // indicate a pass started, resetting config
  startPass() {
    for(let val of Object.values(this.configs)) {
      val.dirPage = 0;
      val.bank = 0;
      val.aSize = 8;
      val.iSize = 8;
      for(let i = 0; i < 256; i++) val.memMap[i] = undefined;
    }
  }

  // generate opcode
  emitOpcode(arch: Architecture, opcode: string, modeNum: number, args: ExpressionNode[]): number {
    let opInfo = getOpcodeInfo(arch, opcode, modeNum);
    // get arguments
    let byteNum = 0;
    let vals: [number, number][] = [];
    for(let i = 0; i < opInfo.adrs.length; i++) {
      let adr = opInfo.adrs[i]!;
      let val = this.assembler.eval(args[i]!);
      let [resVal, size] = this.handleOpArg(adr, val);
      if(adr === AdrMode.DPABS) byteNum = size - 1;
      vals.push([resVal, size]);
    }
    // emit bytes
    let bytes = 0;
    for(let mv of opInfo.argMap) {
      if(mv < 0) {
        let opVal = opInfo.vals[-mv - 1];
        if(Array.isArray(opVal)) {
          this.assembler.writeByte(opVal[byteNum]!);
        } else {
          this.assembler.writeByte(opVal!);
        }
        bytes++;
      } else if(mv > 0) {
        let [resVal, size] = vals[mv - 1]!;
        switch(size) {
          case 1: this.assembler.writeByte(resVal); break;
          case 2: this.assembler.writeWord(resVal); break;
          case 3: this.assembler.writeLong(resVal); break;
        }
        bytes += size;
      }
    }
    return bytes;
  }

  // config directives - TODO: only allow for archs where it makes sense

  dirDirPage(page: ExpressionNode): void {
    let pageVal = this.assembler.checkRange(this.assembler.eval(page), false, 16);
    this.configs[this.assembler.getArch()].dirPage = pageVal;
  }

  dirBank(bank: ExpressionNode): void {
    let bankVal = this.assembler.checkRange(this.assembler.eval(bank), false, 8);
    this.configs[this.assembler.getArch()].bank = bankVal;
  }

  dirXsize(size: ExpressionNode, forI: boolean): void {
    let val = this.assembler.checkNumber(this.assembler.eval(size));
    if(val !== 8 && val !== 16) {
      this.assembler.logError("Expected 8 or 16");
      val = 8;
    }
    if(!forI) this.configs[this.assembler.getArch()].aSize = val;
    if(forI) this.configs[this.assembler.getArch()].iSize = val;
  }

  // opcode argument / address handling

  private handleOpArg(mode: AdrMode, val: ExpressionResult): [number, number] {
    switch(mode) {
      case AdrMode.IMM8: {
        return [this.assembler.checkRange(val, true, 8), 1];
      }
      case AdrMode.DP: {
        return [this.assembler.checkRange(val, false, 8), 1];
      }
      case AdrMode.DPABS: {
        let adr = this.assembler.checkRange(val, false, 16);
        return [adr, adr < 0x100 ? 1 : 2];
      }
      case AdrMode.ABS: {
        return [this.assembler.checkRange(val, false, 16), 2];
      }
      case AdrMode.REL8: {
        let adr = this.assembler.checkRange(val, false, 16);
        let diff = adr - (this.assembler.getPc() + 2);
        diff = ((diff & 0xffff) << 16) >> 16;
        if(diff < -128 || diff > 127) {
          this.assembler.logError("Branch target out of range");
          diff = 0;
        }
        return [diff & 0xff, 1];
      }
      default: throw (mode satisfies never);
    }
  }
}