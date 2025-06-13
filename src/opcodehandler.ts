import { Assembler } from "./assembler.js";
import { ExpressionResult } from "./expressionhandler.js";
import { ExpressionNode } from "./expressionparser.js";
import { AdrMode, Architecture, getOpcodeInfo, SpecialOp } from "./opcodes.js";

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
    [Architecture.W65816]: {dirPage: 0, bank: 0, aSize: 8, iSize: 8, memMap: []},
    [Architecture.SPC700]: {dirPage: 0, bank: 0, aSize: 8, iSize: 8, memMap: []}
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
      let [resVal, size] = this.handleOpArg(arch, adr, val);
      // handle opcode byte selection based on size
      if(adr === AdrMode.DPABS || adr === AdrMode.DPABSLONG) {
        byteNum = size - 1;
      } else if(adr === AdrMode.IMM3PO || adr === AdrMode.IMM4PO) {
        byteNum = resVal;
      }
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
    if(opInfo.spc === SpecialOp.ABSBIT) {
      // special case for spc700 abs.bit
      this.assembler.writeWord(vals[0]![0] | (vals[1]![0] << 13));
      bytes += 2;
    }
    return bytes;
  }

  // config directives
  // TODO: only allow for archs where it makes sense

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

  dirMirror(src: ExpressionNode, start: ExpressionNode, end: ExpressionNode, dstStart: ExpressionNode, dstEnd?: ExpressionNode): void {
    let bank = this.assembler.checkRange(this.assembler.eval(src), false, 8);
    let min = this.assembler.checkRange(this.assembler.eval(start), false, 16);
    let max = this.assembler.checkRange(this.assembler.eval(end), false, 16);
    if(max < min) return this.assembler.logError("End address below start address");
    let dstStartVal = this.assembler.checkRange(this.assembler.eval(dstStart), false, 8);
    let dstEndVal = dstEnd ? this.assembler.checkRange(this.assembler.eval(dstEnd), false, 8) : dstStartVal;
    if(dstEndVal < dstStartVal) return this.assembler.logError("End bank below start bank");
    for(let i = dstStartVal; i <= dstEndVal; i++) {
      this.configs[this.assembler.getArch()].memMap[i] = {min, max, bank};
    }
  }

  dirClrMirror(): void {
    for(let i = 0; i <= 255; i++) {
      this.configs[this.assembler.getArch()].memMap[i] = undefined;
    }
  }

  // opcode argument / address handling

  private handleOpArg(arch: Architecture, mode: AdrMode, val: ExpressionResult): [number, number] {
    switch(mode) {
      case AdrMode.IMM8: {
        return [this.assembler.checkRange(val, true, 8), 1];
      }
      case AdrMode.IMM8P: {
        return [this.assembler.checkRange(val, false, 8), 1];
      }
      case AdrMode.IMM16: {
        return [this.assembler.checkRange(val, true, 16), 2];
      }
      case AdrMode.IMM16P: {
        return [this.assembler.checkRange(val, false, 16), 2];
      }

      case AdrMode.IMM816A: {
        let size = this.configs[arch].aSize;
        return [this.assembler.checkRange(val, true, size), size / 8];
      }
      case AdrMode.IMM816I: {
        let size = this.configs[arch].iSize;
        return [this.assembler.checkRange(val, true, size), size / 8];
      }

      case AdrMode.DP: {
        let adr = this.assembler.checkRange(val, false, 24);
        let dpRes = this.checkDp(arch, adr);
        if(dpRes !== undefined) return [dpRes, 1];
        this.assembler.logError("Address not reachable");
        return [0, 1];
      }
      case AdrMode.DPABS: {
        let adr = this.assembler.checkRange(val, false, 24);
        let dpRes = this.checkDp(arch, adr);
        if(dpRes !== undefined) return [dpRes, 1];
        let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
        if(absRes !== undefined) return [absRes, 2];
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }
      case AdrMode.ABS: {
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
        if(absRes !== undefined) return [absRes, 2];
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }
      case AdrMode.DPABSLONG: {
        let adr = this.assembler.checkRange(val, false, 24);
        let dpRes = this.checkDp(arch, adr);
        if(dpRes !== undefined) return [dpRes, 1];
        let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
        if(absRes !== undefined) return [absRes, 2];
        return [adr, 3];
      }
      case AdrMode.LONG: {
        return [this.assembler.checkRange(val, false, 24), 3];
      }

      case AdrMode.ABS0: {
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, 0);
        if(absRes !== undefined) return [absRes, 2];
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }
      case AdrMode.ABSK: {
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, this.assembler.getPc() >> 16);
        if(absRes !== undefined) return [absRes, 2];
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }

      case AdrMode.REL8: case AdrMode.REL8A: {
        let offset = mode === AdrMode.REL8A ? 3 : 2;
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, this.assembler.getPc() >> 16);
        if(absRes !== undefined) {
          let diff = absRes - (this.assembler.getPc() + offset);
          // clip to signed 16 bit, allow wrapping within bank both ways
          diff = ((diff & 0xffff) << 16) >> 16;
          if(diff < -128 || diff > 127) {
            this.assembler.logError("Branch target out of range");
            diff = 0;
          }
          return [diff & 0xff, 1];
        }
        this.assembler.logError("Address not reachable");
        return [0, 1];
      }
      case AdrMode.REL16: {
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, this.assembler.getPc() >> 16);
        if(absRes !== undefined) {
          let diff = absRes - (this.assembler.getPc() + 3);
          // clip to signed 16 bit, allow wrapping within bank both ways
          diff = ((diff & 0xffff) << 16) >> 16;
          return [diff & 0xffff, 2];
        }
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }

      case AdrMode.IMM3PO: case AdrMode.IMM3P: {
        return [this.assembler.checkRange(val, false, 3), 0];
      }
      case AdrMode.IMM4PO: {
        return [this.assembler.checkRange(val, false, 4), 0];
      }
      case AdrMode.ABS13: {
        let adr = this.assembler.checkRange(val, false, 24);
        let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
        if(absRes !== undefined) {
          if(absRes >= 0x2000) {
            this.assembler.logError("Address out of range");
            absRes &= 0x1fff;
          }
          return [absRes, 2];
        }
        this.assembler.logError("Address not reachable");
        return [0, 2];
      }
      default: throw (mode satisfies never);
    }
  }

  private checkDp(arch: Architecture, adr: number): number | undefined {
    // check if it is in or mirrored in bank 0
    if(this.hasMirror(arch, adr >> 16, 0, adr & 0xffff)) {
      adr &= 0xffff;
      // test if address if within direct page range, allowing wrapping within bank
      let val = (adr - this.configs[this.assembler.getArch()].dirPage) & 0xffff;
      if(val < 0x100) return val;
    }
    return undefined;
  }

  private checkAbs(arch: Architecture, adr: number, bank: number): number | undefined {
    // check if it is in or mirrored in given bank
    if(this.hasMirror(arch, adr >> 16, bank & 0xff, adr & 0xffff)) {
      return adr & 0xffff;
    }
    return undefined;
  }

  private hasMirror(arch: Architecture, bank1: number, bank2: number, adr: number): boolean {
    if(bank1 === bank2) return true;
    // check if bank1 has mirror for bank2
    let test1 = this.configs[arch].memMap[bank1];
    if(test1 && bank2 === test1.bank && adr >= test1.min && adr <= test1.max) return true;
    // check if bank2 had mirror for bank1
    let test2 = this.configs[arch].memMap[bank2];
    if(test2 && bank1 === test2.bank && adr >= test2.min && adr <= test2.max) return true;
    return false;
  }
}