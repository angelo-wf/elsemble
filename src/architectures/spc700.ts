import { addItem, AdrMode, OpcodeMap, SpecialOp } from "../opcodes.js";

const regImpl = /^$/i;
const regXind = /^a,\(x\)$/i;
const regYtoX = /^\(x\),\(y\)$/i;
const regImmi = /^a,#(.+)$/i;
const regIndX = /^a,\((.+)\+x\)$/i;
const regIndY = /^a,\((.+)\)\+y$/i;
const regAdrX = /^a,(.+)\+x$/i;
const regAdrY = /^a,(.+)\+y$/i;
const regAdrs = /^a,(.+)$/i;
const regItoD = /^(.+),#(.+)$/i;
const regDtoD = /^(.+),(.+)$/i;
const rmwAdrX = /^(.+)\+x$/i
const rmwAdrs = /^(.+)$/i;

export function createSpc700Map(): OpcodeMap {
  let map: OpcodeMap = {};

  addImpli(map, "or", regXind, 0x06);
  addImpli(map, "or", regYtoX, 0x19);
  addGener(map, "or", regImmi, 0x08, AdrMode.IMM8);
  addDpage(map, "or", regIndX, 0x07);
  addDpage(map, "or", regIndY, 0x17);
  addDpAbs(map, "or", regAdrX, 0x14, 0x15);
  addGener(map, "or", regAdrY, 0x16, AdrMode.ABS);
  addDpAbs(map, "or", regAdrs, 0x04, 0x05);
  addDpImm(map, "or", regItoD, 0x18);
  addDpaDp(map, "or", regDtoD, 0x09);

  addImpli(map, "and", regXind, 0x26);
  addImpli(map, "and", regYtoX, 0x39);
  addGener(map, "and", regImmi, 0x28, AdrMode.IMM8);
  addDpage(map, "and", regIndX, 0x27);
  addDpage(map, "and", regIndY, 0x37);
  addDpAbs(map, "and", regAdrX, 0x34, 0x35);
  addGener(map, "and", regAdrY, 0x36, AdrMode.ABS);
  addDpAbs(map, "and", regAdrs, 0x24, 0x25);
  addDpImm(map, "and", regItoD, 0x38);
  addDpaDp(map, "and", regDtoD, 0x29);

  addImpli(map, "eor", regXind, 0x46);
  addImpli(map, "eor", regYtoX, 0x59);
  addGener(map, "eor", regImmi, 0x48, AdrMode.IMM8);
  addDpage(map, "eor", regIndX, 0x47);
  addDpage(map, "eor", regIndY, 0x57);
  addDpAbs(map, "eor", regAdrX, 0x54, 0x55);
  addGener(map, "eor", regAdrY, 0x56, AdrMode.ABS);
  addDpAbs(map, "eor", regAdrs, 0x44, 0x45);
  addDpImm(map, "eor", regItoD, 0x58);
  addDpaDp(map, "eor", regDtoD, 0x49);

  addImpli(map, "cmp", regXind, 0x66);
  addImpli(map, "cmp", regYtoX, 0x79);
  addGener(map, "cmp", regImmi, 0x68, AdrMode.IMM8);
  addDpage(map, "cmp", regIndX, 0x67);
  addDpage(map, "cmp", regIndY, 0x77);
  addDpAbs(map, "cmp", regAdrX, 0x74, 0x75);
  addGener(map, "cmp", regAdrY, 0x76, AdrMode.ABS);
  addDpAbs(map, "cmp", regAdrs, 0x64, 0x65);
  addGener(map, "cmp", /^x,#(.+)$/i, 0xc8, AdrMode.IMM8);
  addDpAbs(map, "cmp", /^x,(.+)$/i, 0x3e, 0x1e);
  addGener(map, "cmp", /^y,#(.+)$/i, 0xad, AdrMode.IMM8);
  addDpAbs(map, "cmp", /^y,(.+)$/i, 0x7e, 0x5e);
  addDpImm(map, "cmp", regItoD, 0x78);
  addDpaDp(map, "cmp", regDtoD, 0x69);

  addImpli(map, "adc", regXind, 0x86);
  addImpli(map, "adc", regYtoX, 0x99);
  addGener(map, "adc", regImmi, 0x88, AdrMode.IMM8);
  addDpage(map, "adc", regIndX, 0x87);
  addDpage(map, "adc", regIndY, 0x97);
  addDpAbs(map, "adc", regAdrX, 0x94, 0x95);
  addGener(map, "adc", regAdrY, 0x96, AdrMode.ABS);
  addDpAbs(map, "adc", regAdrs, 0x84, 0x85);
  addDpImm(map, "adc", regItoD, 0x98);
  addDpaDp(map, "adc", regDtoD, 0x89);

  addImpli(map, "sbc", regXind, 0xa6);
  addImpli(map, "sbc", regYtoX, 0xb9);
  addGener(map, "sbc", regImmi, 0xa8, AdrMode.IMM8);
  addDpage(map, "sbc", regIndX, 0xa7);
  addDpage(map, "sbc", regIndY, 0xb7);
  addDpAbs(map, "sbc", regAdrX, 0xb4, 0xb5);
  addGener(map, "sbc", regAdrY, 0xb6, AdrMode.ABS);
  addDpAbs(map, "sbc", regAdrs, 0xa4, 0xa5);
  addDpImm(map, "sbc", regItoD, 0xb8);
  addDpaDp(map, "sbc", regDtoD, 0xa9);

  addImpli(map, "mov", /^x,a$/i, 0x5d);
  addImpli(map, "mov", /^a,x$/i, 0x7d);
  addImpli(map, "mov", /^x,sp$/i, 0x9d);
  addImpli(map, "mov", /^sp,x$/i, 0xbd);
  addImpli(map, "mov", /^a,y$/i, 0xdd);
  addImpli(map, "mov", /^y,a$/i, 0xfd);
  addImpli(map, "mov", /^\(x\+\),a$/i, 0xaf);
  addImpli(map, "mov", /^a,\(x\+\)$/i, 0xbf);
  addImpli(map, "mov", regXind, 0xe6);
  addGener(map, "mov", regImmi, 0xe8, AdrMode.IMM8);
  addDpage(map, "mov", regIndX, 0xe7);
  addDpage(map, "mov", regIndY, 0xf7);
  addDpAbs(map, "mov", regAdrX, 0xf4, 0xf5);
  addGener(map, "mov", regAdrY, 0xf6, AdrMode.ABS);
  addDpAbs(map, "mov", regAdrs, 0xe4, 0xe5);
  addGener(map, "mov", /^x,#(.+)$/i, 0xcd, AdrMode.IMM8);
  addDpage(map, "mov", /^x,(.+)\+y$/i, 0xf9);
  addDpAbs(map, "mov", /^x,(.+)$/i, 0xf8, 0xe9);
  addGener(map, "mov", /^y,#(.+)$/i, 0x8d, AdrMode.IMM8);
  addDpage(map, "mov", /^y,(.+)\+x$/i, 0xfb);
  addDpAbs(map, "mov", /^y,(.+)$/i, 0xeb, 0xec);
  addImpli(map, "mov", /^\(x\),a$/i, 0xc6);
  addDpage(map, "mov", /^\((.+)\+x\),a$/i, 0xc7);
  addDpage(map, "mov", /^\((.+)\)\+y,a$/i, 0xd7);
  addDpAbs(map, "mov", /^(.+)\+x,a$/i, 0xd4, 0xd5);
  addGener(map, "mov", /^(.+)\+y,a$/i, 0xd6, AdrMode.ABS);
  addDpAbs(map, "mov", /^(.+),a$/i, 0xc4, 0xc5);
  addDpage(map, "mov", /^(.+)\+y,x$/i, 0xd9);
  addDpAbs(map, "mov", /^(.+),x$/i, 0xd8, 0xc9);
  addDpage(map, "mov", /^(.+)\+x,y$/i, 0xdb);
  addDpAbs(map, "mov", /^(.+),y$/i, 0xcb, 0xcc);
  addDpImm(map, "mov", regItoD, 0x8f);
  addDpaDp(map, "mov", regDtoD, 0xfa);

  addImpli(map, "asl", /^a$/i, 0x1c);
  addDpage(map, "asl", rmwAdrX, 0x1b);
  addDpAbs(map, "asl", rmwAdrs, 0x0b, 0x0c);

  addImpli(map, "rol", /^a$/i, 0x3c);
  addDpage(map, "rol", rmwAdrX, 0x3b);
  addDpAbs(map, "rol", rmwAdrs, 0x2b, 0x2c);

  addImpli(map, "lsr", /^a$/i, 0x5c);
  addDpage(map, "lsr", rmwAdrX, 0x5b);
  addDpAbs(map, "lsr", rmwAdrs, 0x4b, 0x4c);

  addImpli(map, "ror", /^a$/i, 0x7c);
  addDpage(map, "ror", rmwAdrX, 0x7b);
  addDpAbs(map, "ror", rmwAdrs, 0x6b, 0x6c);

  addImpli(map, "dec", /^a$/i, 0x9c);
  addImpli(map, "dec", /^x$/i, 0x1d);
  addImpli(map, "dec", /^y$/i, 0xdc);
  addDpage(map, "dec", rmwAdrX, 0x9b);
  addDpAbs(map, "dec", rmwAdrs, 0x8b, 0x8c);

  addImpli(map, "inc", /^a$/i, 0xbc);
  addImpli(map, "inc", /^x$/i, 0x3d);
  addImpli(map, "inc", /^y$/i, 0xfc);
  addDpage(map, "inc", rmwAdrX, 0xbb);
  addDpAbs(map, "inc", rmwAdrs, 0xab, 0xac);

  addGener(map, "tset", rmwAdrs, 0x0e, AdrMode.ABS);
  addGener(map, "tclr", rmwAdrs, 0x4e, AdrMode.ABS);

  addDpage(map, "decw", rmwAdrs, 0x1a);
  addDpage(map, "incw", rmwAdrs, 0x3a);
  addDpage(map, "cmpw", /^ya,(.+)$/i, 0x5a);
  addDpage(map, "addw", /^ya,(.+)$/i, 0x7a);
  addDpage(map, "subw", /^ya,(.+)$/i, 0x9a);
  addDpage(map, "movw", /^ya,(.+)$/i, 0xba);
  addDpage(map, "movw", /^(.+),ya$/i, 0xda);

  addAbsBt(map, "or1", /^c,\/(.+),(.+)$/i, 0x2a);
  addAbsBt(map, "or1", /^c,(.+),(.+)$/i, 0x0a);
  addAbsBt(map, "and1", /^c,\/(.+),(.+)$/i, 0x6a);
  addAbsBt(map, "and1", /^c,(.+),(.+)$/i, 0x4a);
  addAbsBt(map, "eor1", /^c,(.+),(.+)$/i, 0x8a);
  addAbsBt(map, "mov1", /^c,(.+),(.+)$/i, 0xaa);
  addAbsBt(map, "mov1", /^(.+),(.+),c$/i, 0xca);
  addAbsBt(map, "not1", regDtoD, 0xea);

  addGener(map, "jmp", /^\((.+)\+x\)$/i, 0x1f, AdrMode.ABS);
  addGener(map, "jmp", rmwAdrs, 0x5f, AdrMode.ABS);
  addGener(map, "call", rmwAdrs, 0x3f, AdrMode.ABS);
  addGener(map, "pcall", rmwAdrs, 0x4f, AdrMode.IMM8P);
  addImmi4(map, "tcall", rmwAdrs, 0x01);

  addGener(map, "bra", rmwAdrs, 0x2f, AdrMode.REL8);
  addDpRel(map, "cbne", /^(.+)\+x,(.+)$/i, 0xde);
  addDpRel(map, "cbne", regDtoD, 0x2e);
  addGener(map, "dbnz", /^y,(.+)$/i, 0xfe, AdrMode.REL8);
  addDpRel(map, "dbnz", regDtoD, 0x6e);

  addDpBit(map, "set1", regDtoD, 0x02);
  addDpBit(map, "clr1", regDtoD, 0x12);
  addDpBiR(map, "bbs", /^(.+),(.+),(.+)$/i, 0x03);
  addDpBiR(map, "bbc", /^(.+),(.+),(.+)$/i, 0x13);

  addGener(map, "bpl", rmwAdrs, 0x10, AdrMode.REL8);
  addGener(map, "bmi", rmwAdrs, 0x30, AdrMode.REL8);
  addGener(map, "bvc", rmwAdrs, 0x50, AdrMode.REL8);
  addGener(map, "bvs", rmwAdrs, 0x70, AdrMode.REL8);
  addGener(map, "bcc", rmwAdrs, 0x90, AdrMode.REL8);
  addGener(map, "bcs", rmwAdrs, 0xb0, AdrMode.REL8);
  addGener(map, "bne", rmwAdrs, 0xd0, AdrMode.REL8);
  addGener(map, "beq", rmwAdrs, 0xf0, AdrMode.REL8);

  addImpli(map, "nop", regImpl, 0x00);
  addImpli(map, "clrp", regImpl, 0x20);
  addImpli(map, "setp", regImpl, 0x40);
  addImpli(map, "clrc", regImpl, 0x60);
  addImpli(map, "setc", regImpl, 0x80);
  addImpli(map, "ei", regImpl, 0xa0);
  addImpli(map, "di", regImpl, 0xc0);
  addImpli(map, "clrv", regImpl, 0xe0);

  addImpli(map, "push", /^psw$/i, 0x0d);
  addImpli(map, "push", /^a$/i, 0x2d);
  addImpli(map, "push", /^x$/i, 0x4d);
  addImpli(map, "push", /^y$/i, 0x6d);
  addImpli(map, "pop", /^psw$/i, 0x8e);
  addImpli(map, "pop", /^a$/i, 0xae);
  addImpli(map, "pop", /^x$/i, 0xce);
  addImpli(map, "pop", /^y$/i, 0xee);

  addImpli(map, "notc", regImpl, 0xed);
  addImpli(map, "div", /^ya,x$/i, 0x9e);
  addImpli(map, "das", /^a$/i, 0xbe);
  addImpli(map, "brk", regImpl, 0x0f);
  addImpli(map, "ret", regImpl, 0x6f);
  addImpli(map, "reti", regImpl, 0x7f);
  addImpli(map, "xcn", /^a$/i, 0x9f);
  addImpli(map, "mul", /^ya$/i, 0xcf);
  addImpli(map, "daa", /^a$/i, 0xdf);
  addImpli(map, "sleep", regImpl, 0xef);
  addImpli(map, "stop", regImpl, 0xff);

  return map;
}

function addImpli(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [], vals: [val], argMap: [-1]});
}

function addGener(map: OpcodeMap, opcode: string, regex: RegExp, val: number, mode: AdrMode): void {
  addItem(map, opcode, {regex, adrs: [mode], vals: [val], argMap: [-1, 1]});
}

function addDpage(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP], vals: [val], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P], vals: [val], argMap: [-1, 1]});
}

function addDpaDp(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP, AdrMode.DP], vals: [val], argMap: [-1, 2, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P, AdrMode.IMM8P], vals: [val], argMap: [-1, 2, 1]});
}

function addDpImm(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP, AdrMode.IMM8], vals: [val], argMap: [-1, 2, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P, AdrMode.IMM8], vals: [val], argMap: [-1, 2, 1]});
}

function addDpRel(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DP, AdrMode.REL8A], vals: [val], argMap: [-1, 1, 2]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P, AdrMode.REL8A], vals: [val], argMap: [-1, 1, 2]});
}

function addDpAbs(map: OpcodeMap, opcode: string, regex: RegExp, vald: number, vala: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.DPABS], vals: [[vald, vala]], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P], vals: [vald], argMap: [-1, 1]});
  addItem(map, opcode + ".a", {regex, adrs: [AdrMode.ABS], vals: [vala], argMap: [-1, 1]});
}

function addImmi4(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  let list: number[] = [
    val, val + 0x10, val + 0x20, val + 0x30, val + 0x40, val + 0x50, val + 0x60, val + 0x70,
    val + 0x80, val + 0x90, val + 0xa0, val + 0xb0, val + 0xc0, val + 0xd0, val + 0xe0, val + 0xf0
  ];
  addItem(map, opcode, {regex, adrs: [AdrMode.IMM4PO], vals: [list], argMap: [-1]});
}

function addDpBit(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  let list: number[] = [val, val + 0x20, val + 0x40, val + 0x60, val + 0x80, val + 0xa0, val + 0xc0, val + 0xe0];
  addItem(map, opcode, {regex, adrs: [AdrMode.DP, AdrMode.IMM3PO], vals: [list], argMap: [-1, 1]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P, AdrMode.IMM3PO], vals: [list], argMap: [-1, 1]});
}

function addDpBiR(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  let list: number[] = [val, val + 0x20, val + 0x40, val + 0x60, val + 0x80, val + 0xa0, val + 0xc0, val + 0xe0];
  addItem(map, opcode, {regex, adrs: [AdrMode.DP, AdrMode.IMM3PO, AdrMode.REL8A], vals: [list], argMap: [-1, 1, 3]});
  addItem(map, opcode + ".b", {regex, adrs: [AdrMode.IMM8P, AdrMode.IMM3PO, AdrMode.REL8A], vals: [list], argMap: [-1, 1, 3]});
}

function addAbsBt(map: OpcodeMap, opcode: string, regex: RegExp, val: number): void {
  addItem(map, opcode, {regex, adrs: [AdrMode.ABS13, AdrMode.IMM3P], vals: [val], argMap: [-1], spc: SpecialOp.ABSBIT});
}
