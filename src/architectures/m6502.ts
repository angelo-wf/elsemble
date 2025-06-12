import { addItem, AdrMode, OpcodeMap } from "../opcodes.js";

const regImpl = /^$/i;
const regAccu = /^a?$/i;
const regImmi = /^#(.+)$/i;
const regIndX = /^\((.+),x\)$/i;
const regIndY = /^\((.+)\),y$/i;
const regIndi = /^\((.+)\)$/i;
const regAdrX = /^(.+),x$/i;
const regAdrY = /^(.+),y$/i;
const regAdrs = /^(.+)$/i;

export function createM6502Map(): OpcodeMap {
  let map: OpcodeMap = {};

  addImmid(map, "ora", regImmi, 0x09);
  addZpage(map, "ora", regIndX, 0x01);
  addZpage(map, "ora", regIndY, 0x11);
  addZpAbs(map, "ora", regAdrX, 0x15, 0x1d);
  addAbsol(map, "ora", regAdrY, 0x19);
  addZpAbs(map, "ora", regAdrs, 0x05, 0x0d);

  addImmid(map, "and", regImmi, 0x29);
  addZpage(map, "and", regIndX, 0x21);
  addZpage(map, "and", regIndY, 0x31);
  addZpAbs(map, "and", regAdrX, 0x35, 0x3d);
  addAbsol(map, "and", regAdrY, 0x39);
  addZpAbs(map, "and", regAdrs, 0x25, 0x2d);

  addImmid(map, "eor", regImmi, 0x49);
  addZpage(map, "eor", regIndX, 0x41);
  addZpage(map, "eor", regIndY, 0x51);
  addZpAbs(map, "eor", regAdrX, 0x55, 0x5d);
  addAbsol(map, "eor", regAdrY, 0x59);
  addZpAbs(map, "eor", regAdrs, 0x45, 0x4d);

  addImmid(map, "adc", regImmi, 0x69);
  addZpage(map, "adc", regIndX, 0x61);
  addZpage(map, "adc", regIndY, 0x71);
  addZpAbs(map, "adc", regAdrX, 0x75, 0x7d);
  addAbsol(map, "adc", regAdrY, 0x79);
  addZpAbs(map, "adc", regAdrs, 0x65, 0x6d);

  addZpage(map, "sta", regIndX, 0x81);
  addZpage(map, "sta", regIndY, 0x91);
  addZpAbs(map, "sta", regAdrX, 0x95, 0x9d);
  addAbsol(map, "sta", regAdrY, 0x99);
  addZpAbs(map, "sta", regAdrs, 0x85, 0x8d);
  
  addImmid(map, "lda", regImmi, 0xa9);
  addZpage(map, "lda", regIndX, 0xa1);
  addZpage(map, "lda", regIndY, 0xb1);
  addZpAbs(map, "lda", regAdrX, 0xb5, 0xbd);
  addAbsol(map, "lda", regAdrY, 0xb9);
  addZpAbs(map, "lda", regAdrs, 0xa5, 0xad);

  addImmid(map, "cmp", regImmi, 0xc9);
  addZpage(map, "cmp", regIndX, 0xc1);
  addZpage(map, "cmp", regIndY, 0xd1);
  addZpAbs(map, "cmp", regAdrX, 0xd5, 0xdd);
  addAbsol(map, "cmp", regAdrY, 0xd9);
  addZpAbs(map, "cmp", regAdrs, 0xc5, 0xcd);

  addImmid(map, "sbc", regImmi, 0xe9);
  addZpage(map, "sbc", regIndX, 0xe1);
  addZpage(map, "sbc", regIndY, 0xf1);
  addZpAbs(map, "sbc", regAdrX, 0xf5, 0xfd);
  addAbsol(map, "sbc", regAdrY, 0xf9);
  addZpAbs(map, "sbc", regAdrs, 0xe5, 0xed);

  addImpli(map, "asl", regAccu, 0x0a);
  addZpAbs(map, "asl", regAdrX, 0x16, 0x1e);
  addZpAbs(map, "asl", regAdrs, 0x06, 0x0e);

  addImpli(map, "rol", regAccu, 0x2a);
  addZpAbs(map, "rol", regAdrX, 0x36, 0x3e);
  addZpAbs(map, "rol", regAdrs, 0x26, 0x2e);

  addImpli(map, "lsr", regAccu, 0x4a);
  addZpAbs(map, "lsr", regAdrX, 0x56, 0x5e);
  addZpAbs(map, "lsr", regAdrs, 0x46, 0x4e);

  addImpli(map, "ror", regAccu, 0x6a);
  addZpAbs(map, "ror", regAdrX, 0x76, 0x7e);
  addZpAbs(map, "ror", regAdrs, 0x66, 0x6e);

  addZpage(map, "stx", regAdrY, 0x96);
  addZpAbs(map, "stx", regAdrs, 0x86, 0x8e);

  addImmid(map, "ldx", regImmi, 0xa2)
  addZpAbs(map, "ldx", regAdrY, 0xb6, 0xbe);
  addZpAbs(map, "ldx", regAdrs, 0xa6, 0xae);

  addZpAbs(map, "dec", regAdrX, 0xd6, 0xde);
  addZpAbs(map, "dec", regAdrs, 0xc6, 0xce);

  addZpAbs(map, "inc", regAdrX, 0xf6, 0xfe);
  addZpAbs(map, "inc", regAdrs, 0xe6, 0xee);

  addZpAbs(map, "bit", regAdrs, 0x24, 0x2c);

  addZpage(map, "sty", regAdrX, 0x94);
  addZpAbs(map, "sty", regAdrs, 0x84, 0x8c);

  addImmid(map, "ldy", regImmi, 0xa0);
  addZpAbs(map, "ldy", regAdrX, 0xb4, 0xbc);
  addZpAbs(map, "ldy", regAdrs, 0xa4, 0xac);

  addImmid(map, "cpy", regImmi, 0xc0);
  addZpAbs(map, "cpy", regAdrs, 0xc4, 0xcc);

  addImmid(map, "cpx", regImmi, 0xe0);
  addZpAbs(map, "cpx", regAdrs, 0xe4, 0xec);

  addAbsol(map, "jmp", regIndi, 0x6c);
  addAbsol(map, "jmp", regAdrs, 0x4c);

  addAbsol(map, "jsr", regAdrs, 0x20);

  addRelat(map, "bpl", regAdrs, 0x10);
  addRelat(map, "bmi", regAdrs, 0x30);
  addRelat(map, "bvc", regAdrs, 0x50);
  addRelat(map, "bvs", regAdrs, 0x70);
  addRelat(map, "bcc", regAdrs, 0x90);
  addRelat(map, "bcs", regAdrs, 0xb0);
  addRelat(map, "bne", regAdrs, 0xd0);
  addRelat(map, "beq", regAdrs, 0xf0);

  addImpli(map, "brk", regImpl, 0x00);
  addImmid(map, "brk", regImmi, 0x00);

  addImpli(map, "rti", regImpl, 0x40);
  addImpli(map, "rts", regImpl, 0x60);
  addImpli(map, "txa", regImpl, 0x8a);
  addImpli(map, "txs", regImpl, 0x9a);
  addImpli(map, "tax", regImpl, 0xaa);
  addImpli(map, "tsx", regImpl, 0xba);
  addImpli(map, "dex", regImpl, 0xca);
  addImpli(map, "nop", regImpl, 0xea);

  addImpli(map, "php", regImpl, 0x08);
  addImpli(map, "clc", regImpl, 0x18);
  addImpli(map, "plp", regImpl, 0x28);
  addImpli(map, "sec", regImpl, 0x38);
  addImpli(map, "pha", regImpl, 0x48);
  addImpli(map, "cli", regImpl, 0x58);
  addImpli(map, "pla", regImpl, 0x68);
  addImpli(map, "sei", regImpl, 0x78);
  addImpli(map, "dey", regImpl, 0x88);
  addImpli(map, "tya", regImpl, 0x98);
  addImpli(map, "tay", regImpl, 0xa8);
  addImpli(map, "clv", regImpl, 0xb8);
  addImpli(map, "iny", regImpl, 0xc8);
  addImpli(map, "cld", regImpl, 0xd8);
  addImpli(map, "inx", regImpl, 0xe8);
  addImpli(map, "sed", regImpl, 0xf8);

  return map;
}

function addImpli(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [], vals: [val], argMap: [-1]});
}

function addImmid(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.IMM8], vals: [val], argMap: [-1, 1]});
}

function addZpage(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP], vals: [val], argMap: [-1, 1]});
}

function addZpAbs(map: OpcodeMap, opcode: string, regex: RegExp, valz: number, vala: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DPABS], vals: [[valz, vala]], argMap: [-1, 1]});
  addItem(map, opcode + ".a", {regex, adrs: [AdrMode.DP], vals: [vala], argMap: [-1, 1]});
}

function addAbsol(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.ABS], vals: [val], argMap: [-1, 1]});
}

function addRelat(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.REL8], vals: [val], argMap: [-1, 1]});
}
