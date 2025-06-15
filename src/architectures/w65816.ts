import { addItem, AdrMode, OpcodeMap, SpecialOp } from "../opcodes.js";

const regImpl = /^$/i;
const regAccu = /^a?$/i;
const regImmi = /^#(.+)$/i;
const regIndX = /^\((.+),x\)$/i;
const regInsy = /^\((.+),s\),y$/i;
const regIndY = /^\((.+)\),y$/i;
const regInlY = /^\[(.+)\],y$/i;
const regIndi = /^\((.+)\)$/i;
const regIndl = /^\[(.+)\]$/i;
const regAdrS = /^(.+),s$/i;
const regAdrX = /^(.+),x$/i;
const regAdrY = /^(.+),y$/i;
const regBmov = /^(.+),(.+)$/i;
const regAdrs = /^(.+)$/i;

export function createW65816Map(): OpcodeMap {
  let map: OpcodeMap = {};

  addImmid(map, "ora", regImmi, 0x09, AdrMode.IMM816A);
  addDpage(map, "ora", regIndX, 0x01);
  addGener(map, "ora", regInsy, 0x13, AdrMode.IMM8P);
  addDpage(map, "ora", regIndY, 0x11);
  addDpage(map, "ora", regInlY, 0x17);
  addDpage(map, "ora", regIndi, 0x12);
  addDpage(map, "ora", regIndl, 0x07);
  addGener(map, "ora", regAdrS, 0x03, AdrMode.IMM8P);
  addDpAbL(map, "ora", regAdrX, 0x15, 0x1d, 0x1f);
  addAbsol(map, "ora", regAdrY, 0x19);
  addDpAbL(map, "ora", regAdrs, 0x05, 0x0d, 0x0f);

  addImmid(map, "and", regImmi, 0x29, AdrMode.IMM816A);
  addDpage(map, "and", regIndX, 0x21);
  addGener(map, "and", regInsy, 0x33, AdrMode.IMM8P);
  addDpage(map, "and", regIndY, 0x31);
  addDpage(map, "and", regInlY, 0x37);
  addDpage(map, "and", regIndi, 0x32);
  addDpage(map, "and", regIndl, 0x27);
  addGener(map, "and", regAdrS, 0x23, AdrMode.IMM8P);
  addDpAbL(map, "and", regAdrX, 0x35, 0x3d, 0x3f);
  addAbsol(map, "and", regAdrY, 0x39);
  addDpAbL(map, "and", regAdrs, 0x25, 0x2d, 0x2f);

  addImmid(map, "eor", regImmi, 0x49, AdrMode.IMM816A);
  addDpage(map, "eor", regIndX, 0x41);
  addGener(map, "eor", regInsy, 0x53, AdrMode.IMM8P);
  addDpage(map, "eor", regIndY, 0x51);
  addDpage(map, "eor", regInlY, 0x57);
  addDpage(map, "eor", regIndi, 0x52);
  addDpage(map, "eor", regIndl, 0x47);
  addGener(map, "eor", regAdrS, 0x43, AdrMode.IMM8P);
  addDpAbL(map, "eor", regAdrX, 0x55, 0x5d, 0x5f);
  addAbsol(map, "eor", regAdrY, 0x59);
  addDpAbL(map, "eor", regAdrs, 0x45, 0x4d, 0x4f);

  addImmid(map, "adc", regImmi, 0x69, AdrMode.IMM816A);
  addDpage(map, "adc", regIndX, 0x61);
  addGener(map, "adc", regInsy, 0x73, AdrMode.IMM8P);
  addDpage(map, "adc", regIndY, 0x71);
  addDpage(map, "adc", regInlY, 0x77);
  addDpage(map, "adc", regIndi, 0x72);
  addDpage(map, "adc", regIndl, 0x67);
  addGener(map, "adc", regAdrS, 0x63, AdrMode.IMM8P);
  addDpAbL(map, "adc", regAdrX, 0x75, 0x7d, 0x7f);
  addAbsol(map, "adc", regAdrY, 0x79);
  addDpAbL(map, "adc", regAdrs, 0x65, 0x6d, 0x6f);

  addDpage(map, "sta", regIndX, 0x81);
  addGener(map, "sta", regInsy, 0x93, AdrMode.IMM8P);
  addDpage(map, "sta", regIndY, 0x91);
  addDpage(map, "sta", regInlY, 0x97);
  addDpage(map, "sta", regIndi, 0x92);
  addDpage(map, "sta", regIndl, 0x87);
  addGener(map, "sta", regAdrS, 0x83, AdrMode.IMM8P);
  addDpAbL(map, "sta", regAdrX, 0x95, 0x9d, 0x9f);
  addAbsol(map, "sta", regAdrY, 0x99);
  addDpAbL(map, "sta", regAdrs, 0x85, 0x8d, 0x8f);

  addImmid(map, "lda", regImmi, 0xa9, AdrMode.IMM816A);
  addDpage(map, "lda", regIndX, 0xa1);
  addGener(map, "lda", regInsy, 0xb3, AdrMode.IMM8P);
  addDpage(map, "lda", regIndY, 0xb1);
  addDpage(map, "lda", regInlY, 0xb7);
  addDpage(map, "lda", regIndi, 0xb2);
  addDpage(map, "lda", regIndl, 0xa7);
  addGener(map, "lda", regAdrS, 0xa3, AdrMode.IMM8P);
  addDpAbL(map, "lda", regAdrX, 0xb5, 0xbd, 0xbf);
  addAbsol(map, "lda", regAdrY, 0xb9);
  addDpAbL(map, "lda", regAdrs, 0xa5, 0xad, 0xaf);

  addImmid(map, "cmp", regImmi, 0xc9, AdrMode.IMM816A);
  addDpage(map, "cmp", regIndX, 0xc1);
  addGener(map, "cmp", regInsy, 0xd3, AdrMode.IMM8P);
  addDpage(map, "cmp", regIndY, 0xd1);
  addDpage(map, "cmp", regInlY, 0xd7);
  addDpage(map, "cmp", regIndi, 0xd2);
  addDpage(map, "cmp", regIndl, 0xc7);
  addGener(map, "cmp", regAdrS, 0xc3, AdrMode.IMM8P);
  addDpAbL(map, "cmp", regAdrX, 0xd5, 0xdd, 0xdf);
  addAbsol(map, "cmp", regAdrY, 0xd9);
  addDpAbL(map, "cmp", regAdrs, 0xc5, 0xcd, 0xcf);

  addImmid(map, "sbc", regImmi, 0xe9, AdrMode.IMM816A);
  addDpage(map, "sbc", regIndX, 0xe1);
  addGener(map, "sbc", regInsy, 0xf3, AdrMode.IMM8P);
  addDpage(map, "sbc", regIndY, 0xf1);
  addDpage(map, "sbc", regInlY, 0xf7);
  addDpage(map, "sbc", regIndi, 0xf2);
  addDpage(map, "sbc", regIndl, 0xe7);
  addGener(map, "sbc", regAdrS, 0xe3, AdrMode.IMM8P);
  addDpAbL(map, "sbc", regAdrX, 0xf5, 0xfd, 0xff);
  addAbsol(map, "sbc", regAdrY, 0xf9);
  addDpAbL(map, "sbc", regAdrs, 0xe5, 0xed, 0xef);

  addImpli(map, "asl", regAccu, 0x0a);
  addDpAbs(map, "asl", regAdrX, 0x16, 0x1e);
  addDpAbs(map, "asl", regAdrs, 0x06, 0x0e);

  addImpli(map, "rol", regAccu, 0x2a);
  addDpAbs(map, "rol", regAdrX, 0x36, 0x3e);
  addDpAbs(map, "rol", regAdrs, 0x26, 0x2e);

  addImpli(map, "lsr", regAccu, 0x4a);
  addDpAbs(map, "lsr", regAdrX, 0x56, 0x5e);
  addDpAbs(map, "lsr", regAdrs, 0x46, 0x4e);

  addImpli(map, "ror", regAccu, 0x6a);
  addDpAbs(map, "ror", regAdrX, 0x76, 0x7e);
  addDpAbs(map, "ror", regAdrs, 0x66, 0x6e);

  addDpage(map, "stx", regAdrY, 0x96);
  addDpAbs(map, "stx", regAdrs, 0x86, 0x8e);

  addImmid(map, "ldx", regImmi, 0xa2, AdrMode.IMM816I);
  addDpAbs(map, "ldx", regAdrY, 0xb6, 0xbe);
  addDpAbs(map, "ldx", regAdrs, 0xa6, 0xae);

  addImpli(map, "dec", regAccu, 0x3a);
  addDpAbs(map, "dec", regAdrX, 0xd6, 0xde);
  addDpAbs(map, "dec", regAdrs, 0xc6, 0xce);

  addImpli(map, "inc", regAccu, 0x1a);
  addDpAbs(map, "inc", regAdrX, 0xf6, 0xfe);
  addDpAbs(map, "inc", regAdrs, 0xe6, 0xee);

  addDpAbs(map, "tsb", regAdrs, 0x04, 0x0c);
  addDpAbs(map, "trb", regAdrs, 0x14, 0x1c);

  addImmid(map, "bit", regImmi, 0x89, AdrMode.IMM816A);
  addDpAbs(map, "bit", regAdrX, 0x34, 0x3c);
  addDpAbs(map, "bit", regAdrs, 0x24, 0x2c);

  addDpAbs(map, "stz", regAdrX, 0x74, 0x9e);
  addDpAbs(map, "stz", regAdrs, 0x64, 0x9c);

  addDpage(map, "sty", regAdrX, 0x94);
  addDpAbs(map, "sty", regAdrs, 0x84, 0x8c);

  addImmid(map, "ldy", regImmi, 0xa0, AdrMode.IMM816I);
  addDpAbs(map, "ldy", regAdrX, 0xb4, 0xbc);
  addDpAbs(map, "ldy", regAdrs, 0xa4, 0xac);

  addImmid(map, "cpy", regImmi, 0xc0, AdrMode.IMM816I);
  addDpAbs(map, "cpy", regAdrs, 0xc4, 0xcc);

  addImmid(map, "cpx", regImmi, 0xe0, AdrMode.IMM816I);
  addDpAbs(map, "cpx", regAdrs, 0xe4, 0xec);

  addAbsok(map, "jmp", regIndX, 0x7c);
  addGener(map, "jmp", regIndi, 0x6c, AdrMode.ABS0);
  addAbsok(map, "jmp", regAdrs, 0x4c);
  addGener(map, "jml", regIndl, 0xdc, AdrMode.ABS0);
  addGener(map, "jml", regAdrs, 0x5c, AdrMode.LONG);

  addAbsok(map, "jsr", regIndX, 0xfc);
  addAbsok(map, "jsr", regAdrs, 0x20);
  addGener(map, "jsl", regAdrs, 0x22, AdrMode.LONG);

  addGener(map, "pea", regAdrs, 0xf4, AdrMode.IMM16P);
  addDpage(map, "pei", regIndi, 0xd4);
  addGener(map, "per", regAdrs, 0x62, AdrMode.REL16);

  addGener(map, "rep", regImmi, 0xc2, AdrMode.IMM8, SpecialOp.REP);
  addGener(map, "sep", regImmi, 0xe2, AdrMode.IMM8, SpecialOp.SEP);

  addBlmov(map, "mvp", regBmov, 0x44);
  addBlmov(map, "mvn", regBmov, 0x54);

  addGener(map, "brl", regAdrs, 0x82, AdrMode.REL16);

  addGener(map, "bpl", regAdrs, 0x10, AdrMode.REL8);
  addGener(map, "bmi", regAdrs, 0x30, AdrMode.REL8);
  addGener(map, "bvc", regAdrs, 0x50, AdrMode.REL8);
  addGener(map, "bvs", regAdrs, 0x70, AdrMode.REL8);
  addGener(map, "bra", regAdrs, 0x80, AdrMode.REL8);
  addGener(map, "bcc", regAdrs, 0x90, AdrMode.REL8);
  addGener(map, "bcs", regAdrs, 0xb0, AdrMode.REL8);
  addGener(map, "bne", regAdrs, 0xd0, AdrMode.REL8);
  addGener(map, "beq", regAdrs, 0xf0, AdrMode.REL8);

  addImpli(map, "brk", regImpl, 0x00);
  addGener(map, "brk", regImmi, 0x00, AdrMode.IMM8);
  addImpli(map, "cop", regImpl, 0x02);
  addGener(map, "cop", regImmi, 0x02, AdrMode.IMM8);
  addGener(map, "wdm", regImmi, 0x42, AdrMode.IMM8);

  addImpli(map, "rti", regImpl, 0x40);
  addImpli(map, "rts", regImpl, 0x60);
  addImpli(map, "phy", regImpl, 0x5a);
  addImpli(map, "ply", regImpl, 0x7a);
  addImpli(map, "txa", regImpl, 0x8a);
  addImpli(map, "txs", regImpl, 0x9a);
  addImpli(map, "tax", regImpl, 0xaa);
  addImpli(map, "tsx", regImpl, 0xba);
  addImpli(map, "dex", regImpl, 0xca);
  addImpli(map, "phx", regImpl, 0xda);
  addImpli(map, "nop", regImpl, 0xea);
  addImpli(map, "plx", regImpl, 0xfa);

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

  addImpli(map, "phd", regImpl, 0x0b);
  addImpli(map, "tcs", regImpl, 0x1b);
  addImpli(map, "pld", regImpl, 0x2b);
  addImpli(map, "tsc", regImpl, 0x3b);
  addImpli(map, "phk", regImpl, 0x4b);
  addImpli(map, "tcd", regImpl, 0x5b);
  addImpli(map, "rtl", regImpl, 0x6b);
  addImpli(map, "tdc", regImpl, 0x7b);
  addImpli(map, "phb", regImpl, 0x8b);
  addImpli(map, "txy", regImpl, 0x9b);
  addImpli(map, "plb", regImpl, 0xab);
  addImpli(map, "tyx", regImpl, 0xbb);
  addImpli(map, "wai", regImpl, 0xcb);
  addImpli(map, "stp", regImpl, 0xdb);
  addImpli(map, "xba", regImpl, 0xeb);
  addImpli(map, "xce", regImpl, 0xfb);

  return map;
}

function addImpli(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [], vals: [val], argMap: [-1]});
}

function addGener(map: OpcodeMap, opcode: string, regex: RegExp, val: number, mode: AdrMode, spc?: SpecialOp): void {
  addItem(map, opcode, {regex, adrs: [mode], vals: [val], argMap: [-1, 1], spc});
}

function addImmid(map: OpcodeMap, opcode: string, regex: RegExp, val: number, mode: AdrMode): void {
  addItem(map, opcode, {regex, adrs: [mode], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".w", {regex, adrs: [AdrMode.IMM16], vals: [val], argMap: [-1, 1]});
}

function addDpage(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P], vals: [val], argMap: [-1, 1]});
}

function addDpAbs(map: OpcodeMap, opcode: string, regex: RegExp, vald: number, vala: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DPABS], vals: [[vald, vala]], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P], vals: [vald], argMap: [-1, 1]});
  addItem(map, opcode + ".w", {regex, adrs: [AdrMode.IMM16P], vals: [vala], argMap: [-1, 1]});
  addItem(map, opcode + ".a", {regex, adrs: [AdrMode.ABS], vals: [vala], argMap: [-1, 1]});
}

function addAbsol(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.ABS], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".w", {regex, adrs: [AdrMode.IMM16P], vals: [val], argMap: [-1, 1]});
}

function addDpAbL(map: OpcodeMap, opcode: string, regex: RegExp, vald: number, vala: number, vall: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DPABSLONG], vals: [[vald, vala, vall]], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P], vals: [vald], argMap: [-1, 1]});
  addItem(map, opcode + ".w", {regex, adrs: [AdrMode.IMM16P], vals: [vala], argMap: [-1, 1]});
  addItem(map, opcode + ".a", {regex, adrs: [AdrMode.ABS], vals: [vala], argMap: [-1, 1]});
  addItem(map, opcode + ".l", {regex, adrs: [AdrMode.LONG], vals: [vall], argMap: [-1, 1]});
}

function addAbsok(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.ABSK], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".w", {regex, adrs: [AdrMode.IMM16P], vals: [val], argMap: [-1, 1]});
}

function addBlmov(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.IMM8P, AdrMode.IMM8P], vals: [val], argMap: [-1, 2, 1]});
}
