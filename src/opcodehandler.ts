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
  private smart = false;

  constructor(assembler: Assembler) {
    this.assembler = assembler;
  }

  // indicate a pass started, resetting config
  startPass(): void {
    for(let val of Object.values(this.configs)) {
      val.dirPage = 0;
      val.bank = 0;
      val.aSize = 8;
      val.iSize = 8;
      for(let i = 0; i < 256; i++) val.memMap[i] = undefined;
    }
    this.smart = false;
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
    // handle special cases for .smart handling
    if(this.smart && opInfo.spc) this.handleSmart(arch, opInfo.spc, vals);
    return bytes;
  }

  private handleSmart(arch: Architecture, type: SpecialOp, vals: [number, number][]): void {
    if(type === SpecialOp.REP) {
      if((vals[0]![0] & 0x20) !== 0) this.configs[arch].aSize = 16;
      if((vals[0]![0] & 0x10) !== 0) this.configs[arch].iSize = 16;
    }
    if(type === SpecialOp.SEP) {
      if((vals[0]![0] & 0x20) !== 0) this.configs[arch].aSize = 8;
      if((vals[0]![0] & 0x10) !== 0) this.configs[arch].iSize = 8;
    }
    if(type === SpecialOp.SETP || type == SpecialOp.CLRP) {
      this.configs[arch].dirPage = type === SpecialOp.SETP ? 0x100 : 0;
    }
  }

  // config directives

  dirDirPage(page: ExpressionNode, arch?: Architecture): void {
    if(arch !== Architecture.W65816 && arch !== Architecture.SPC700) {
      return this.assembler.logError("Cannot use .dirpage outside of architectures w65816 or spc700");
    }
    let pageVal = this.assembler.checkRange(this.assembler.eval(page), false, 16);
    if(arch === Architecture.SPC700 && (pageVal !== 0 && pageVal !== 0x100)) {
      return this.assembler.logError("spc700 requires direct page to be at 0 or 256");
    }
    this.configs[arch].dirPage = pageVal;
  }

  dirBank(bank: ExpressionNode, arch?: Architecture): void {
    if(arch !== Architecture.W65816) return this.assembler.logError("Cannot use .bank outside architecture w65816");
    let bankVal = this.assembler.checkRange(this.assembler.eval(bank), false, 8);
    this.configs[arch].bank = bankVal;
  }

  dirXsize(size: ExpressionNode, forI: boolean, arch?: Architecture): void {
    if(arch !== Architecture.W65816) return this.assembler.logError(`Cannot use ${forI ? ".isize" : ".asize"} outside architecture w65816`);
    let val = this.assembler.checkNumber(this.assembler.eval(size));
    if(val !== 8 && val !== 16) {
      this.assembler.logError("Expected 8 or 16");
      val = 8;
    }
    if(!forI) this.configs[arch].aSize = val;
    if(forI) this.configs[arch].iSize = val;
  }

  dirMirror(src: ExpressionNode, start: ExpressionNode, end: ExpressionNode, dstStart: ExpressionNode, dstEnd?: ExpressionNode, arch?: Architecture): void {
    if(arch !== Architecture.W65816) return this.assembler.logError("Cannot use .mirror outside architecture w65816");
    let bank = this.assembler.checkRange(this.assembler.eval(src), false, 8);
    let min = this.assembler.checkRange(this.assembler.eval(start), false, 16);
    let max = this.assembler.checkRange(this.assembler.eval(end), false, 16);
    if(max < min) return this.assembler.logError("End address below start address");
    let dstStartVal = this.assembler.checkRange(this.assembler.eval(dstStart), false, 8);
    let dstEndVal = dstEnd ? this.assembler.checkRange(this.assembler.eval(dstEnd), false, 8) : dstStartVal;
    if(dstEndVal < dstStartVal) return this.assembler.logError("End bank below start bank");
    for(let i = dstStartVal; i <= dstEndVal; i++) {
      this.configs[arch].memMap[i] = {min, max, bank};
    }
  }

  dirClrMirror(arch?: Architecture): void {
    if(arch !== Architecture.W65816) return this.assembler.logError("Cannot use .clrmirror outside architecture w65816");
    for(let i = 0; i <= 255; i++) {
      this.configs[arch].memMap[i] = undefined;
    }
  }

  dirSmart(val: string): void {
    let valStr = this.assembler.checkString(val);
    if(valStr !== "on" && valStr !== "off") return this.assembler.logError("Expected 'on' or 'off'");
    this.smart = valStr === "on";
  } 

  // opcode argument / address handling

  private handleOpArg(arch: Architecture, mode: AdrMode, val: ExpressionResult): [number, number] {
    switch(mode) {
      case AdrMode.IMM8: return this.adrImmediate(val, true, 8);
      case AdrMode.IMM8P: return this.adrImmediate(val, false, 8);
      case AdrMode.IMM16: return this.adrImmediate(val, true, 16);
      case AdrMode.IMM16P: return this.adrImmediate(val, false, 16);
      case AdrMode.IMM816A: return this.adrImmediate(val, true, this.configs[arch].aSize);
      case AdrMode.IMM816I: return this.adrImmediate(val, true, this.configs[arch].iSize);
      case AdrMode.DP: return this.adrDpAbs(val, true, arch);
      case AdrMode.DPABS: return this.adrDpAbs(val, false, arch);
      case AdrMode.ABS: return this.adrAbsolute(val, this.configs[arch].bank, arch);
      case AdrMode.DPABSLONG: return this.adrDpAbsLong(val, false, arch);
      case AdrMode.LONG: return this.adrDpAbsLong(val, true, arch);
      case AdrMode.ABS0: return this.adrAbsolute(val, 0, arch);
      case AdrMode.ABSK: return this.adrAbsolute(val, this.assembler.getPc() >> 16, arch);
      case AdrMode.REL8: return this.adrRelative(val, 2, false, arch);
      case AdrMode.REL8A: return this.adrRelative(val, 3, false, arch);
      case AdrMode.REL16: return this.adrRelative(val, 3, true, arch);
      case AdrMode.IMM3PO: return this.adrSmallImmediate(val, 3);
      case AdrMode.IMM3P: return this.adrSmallImmediate(val, 3);
      case AdrMode.IMM4PO: return this.adrSmallImmediate(val, 4);
      case AdrMode.ABS13: return this.adrAbsBit(val, arch);
      default: throw (mode satisfies never);
    }
  }

  private checkDp(arch: Architecture, adr: number): number | undefined {
    // check if it is in or mirrored in bank 0
    if(this.hasMirror(arch, adr >> 16, 0, adr & 0xffff)) {
      adr &= 0xffff;
      // test if address if within direct page range, allowing wrapping within bank
      let val = (adr - this.configs[arch].dirPage) & 0xffff;
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

  // address mode type checks

  private adrImmediate(val: ExpressionResult, negative: boolean, size: number): [number, number] {
    return [this.assembler.checkRange(val, negative, size), size / 8];
  }

  private adrSmallImmediate(val: ExpressionResult, size: number): [number, number] {
    return [this.assembler.checkRange(val, false, size), 0];
  }

  private adrAbsolute(val: ExpressionResult, bank: number, arch: Architecture): [number, number] {
    let adr = this.assembler.checkRange(val, false, 24);
    let absRes = this.checkAbs(arch, adr, bank);
    if(absRes !== undefined) return [absRes, 2];
    this.assembler.logError("Address not reachable");
    return [0, 2];
  }

  private adrDpAbs(val: ExpressionResult, dpOnly: boolean, arch: Architecture): [number, number] {
    let adr = this.assembler.checkRange(val, false, 24);
    let dpRes = this.checkDp(arch, adr);
    if(dpRes !== undefined) return [dpRes, 1];
    if(!dpOnly) {
      let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
      if(absRes !== undefined) return [absRes, 2];
    }
    this.assembler.logError("Address not reachable");
    return [0, 2];
  }

  private adrDpAbsLong(val: ExpressionResult, longOnly: boolean, arch: Architecture): [number, number] {
    let adr = this.assembler.checkRange(val, false, 24);
    if(!longOnly) {
      let dpRes = this.checkDp(arch, adr);
      if(dpRes !== undefined) return [dpRes, 1];
      let absRes = this.checkAbs(arch, adr, this.configs[arch].bank);
      if(absRes !== undefined) return [absRes, 2];
    }
    return [adr, 3];
  }

  private adrRelative(val: ExpressionResult, offset: number, long: boolean, arch: Architecture): [number, number] {
    let adr = this.assembler.checkRange(val, false, 24);
    let absRes = this.checkAbs(arch, adr, this.assembler.getPc() >> 16);
    if(absRes !== undefined) {
      let diff = absRes - (this.assembler.getPc() + offset);
      // clip to signed 16 bit, allow wrapping within bank both ways
      diff = ((diff & 0xffff) << 16) >> 16;
      if(!long && (diff < -128 || diff > 127)) {
        this.assembler.logError("Branch target out of range");
        diff = 0;
      }
      return long ? [diff & 0xffff, 2] : [diff & 0xff, 1];
    }
    this.assembler.logError("Address not reachable");
    return [0, long ? 2 : 1];
  }

  private adrAbsBit(val: ExpressionResult, arch: Architecture): [number, number] {
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
}