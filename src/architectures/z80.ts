import { addItem, AdrMode, matcher, OpcodeMap } from "../opcodes.js";

const regs: string[] = ["b", "c", "d", "e", "h", "l", "(hl)", "a"];
const conds: string[] = ["nz", "z", "nc", "c", "po", "pe", "p", "m"];
const ixys: {r: string, p: number, o: number, q: number}[] = [
  {r: "ixh", p: 0xdd, o: 0, q: 0}, {r: "ixl", p: 0xdd, o: 1, q: 0},
  {r: "iyh", p: 0xfd, o: 0, q: 1}, {r: "iyl", p: 0xfd, o: 1, q: 1}
];

export function createZ80Map(): OpcodeMap {
  let map: OpcodeMap = {};

  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("b," + r), 0x40 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher("b," + ixy.r), ixy.p, 0x44 + ixy.o);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("c," + r), 0x48 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher("c," + ixy.r), ixy.p, 0x4c + ixy.o);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("d," + r), 0x50 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher("d," + ixy.r), ixy.p, 0x54 + ixy.o);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("e," + r), 0x58 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher("e," + ixy.r), ixy.p, 0x5c + ixy.o);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("h," + r), 0x60 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher(["ixh", "iyh"][ixy.q] + "," + ixy.r), ixy.p, 0x64 + ixy.o);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("l," + r), 0x68 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher(["ixl", "iyl"][ixy.q] + "," + ixy.r), ixy.p, 0x6c + ixy.o);
  for(let [i, r] of regs.entries()) if(r !== "(hl)") addImpli(map, "ld", matcher("(hl)," + r), 0x70 + i);
  for(let [i, r] of regs.entries()) addImpli(map, "ld", matcher("a," + r), 0x78 + i);
  for(let ixy of ixys) addImpl2(map, "ld", matcher("a," + ixy.r), ixy.p, 0x7c + ixy.o);
  addImpli(map, "ld", matcher("(bc),a"), 0x02);
  addImpli(map, "ld", matcher("(de),a"), 0x12);
  addImpli(map, "ld", matcher("a,(bc)"), 0x0a);
  addImpli(map, "ld", matcher("a,(de)"), 0x1a);
  addImpli(map, "ld", matcher("sp,hl"), 0xf9);
  addImpl2(map, "ld", matcher("sp,ix"), 0xdd, 0xf9);
  addImpl2(map, "ld", matcher("sp,iy"), 0xfd, 0xf9);
  addImpl2(map, "ld", matcher("i,a"), 0xed, 0x47);
  addImpl2(map, "ld", matcher("a,i"), 0xed, 0x57);
  addImpl2(map, "ld", matcher("r,a"), 0xed, 0x4f);
  addImpl2(map, "ld", matcher("a,r"), 0xed, 0x5f);
  for(let [i, r] of regs.entries()) if(r !== "(hl)") addGene2(map, "ld", matcher(r + ",(ix", ")"), 0xdd, 0x46 + (8 * i), AdrMode.IMM8S);
  for(let [i, r] of regs.entries()) if(r !== "(hl)") addGene2(map, "ld", matcher(r + ",(iy", ")"), 0xfd, 0x46 + (8 * i), AdrMode.IMM8S);
  addGene2(map, "ld", matcher("bc,(", ")"), 0xed, 0x4b, AdrMode.ABS);
  addGene2(map, "ld", matcher("de,(", ")"), 0xed, 0x5b, AdrMode.ABS);
  addGener(map, "ld", matcher("hl,(", ")"), 0x2a, AdrMode.ABS);
  addGene2(map, "ld", matcher("ix,(", ")"), 0xdd, 0x2a, AdrMode.ABS);
  addGene2(map, "ld", matcher("iy,(", ")"), 0xfd, 0x2a, AdrMode.ABS);
  addGene2(map, "ld", matcher("sp,(", ")"), 0xed, 0x7b, AdrMode.ABS);
  addGener(map, "ld", matcher("a,(", ")"), 0x3a, AdrMode.ABS);
  for(let [i, r] of regs.entries()) if(r !== "(hl)") addGene2(map, "ld", matcher("(ix", ")," + r), 0xdd, 0x70 + i, AdrMode.IMM8S);
  for(let [i, r] of regs.entries()) if(r !== "(hl)") addGene2(map, "ld", matcher("(iy", ")," + r), 0xfd, 0x70 + i, AdrMode.IMM8S);
  addGene2(map, "ld", matcher("(", "),bc"), 0xed, 0x43, AdrMode.ABS);
  addGene2(map, "ld", matcher("(", "),de"), 0xed, 0x53, AdrMode.ABS);
  addGener(map, "ld", matcher("(", "),hl"), 0x22, AdrMode.ABS);
  addGene2(map, "ld", matcher("(", "),ix"), 0xdd, 0x22, AdrMode.ABS);
  addGene2(map, "ld", matcher("(", "),iy"), 0xfd, 0x22, AdrMode.ABS);
  addGene2(map, "ld", matcher("(", "),sp"), 0xed, 0x73, AdrMode.ABS);
  addGener(map, "ld", matcher("(", "),a"), 0x32, AdrMode.ABS);
  for(let [i, r] of regs.entries()) addGener(map, "ld", matcher(r + ",", ""), 0x06 + (i * 8), AdrMode.IMM8);
  for(let ixy of ixys) addGene2(map, "ld", matcher(ixy.r + ",", ""), ixy.p, 0x26 + (ixy.o * 8), AdrMode.IMM8);
  addGener(map, "ld", matcher("bc,", ""), 0x01, AdrMode.IMM16);
  addGener(map, "ld", matcher("de,", ""), 0x11, AdrMode.IMM16);
  addGener(map, "ld", matcher("hl,", ""), 0x21, AdrMode.IMM16);
  addGene2(map, "ld", matcher("ix,", ""), 0xdd, 0x21, AdrMode.IMM16);
  addGene2(map, "ld", matcher("iy,", ""), 0xfd, 0x21, AdrMode.IMM16);
  addGener(map, "ld", matcher("sp,", ""), 0x31, AdrMode.IMM16);
  addIxyIm(map, "ld", matcher("(ix", "),", ""), 0xdd);
  addIxyIm(map, "ld", matcher("(iy", "),", ""), 0xfd);

  for(let [i, r] of regs.entries()) addImpli(map, "add", matcher("a," + r), 0x80 + i);
  for(let ixy of ixys) addImpl2(map, "add", matcher("a," + ixy.r), ixy.p, 0x84 + ixy.o);
  addImpli(map, "add", matcher("hl,bc"), 0x09);
  addImpli(map, "add", matcher("hl,de"), 0x19);
  addImpli(map, "add", matcher("hl,hl"), 0x29);
  addImpli(map, "add", matcher("hl,sp"), 0x39);
  addGene2(map, "add", matcher("a,(ix", ")"), 0xdd, 0x86, AdrMode.IMM8S);
  addGene2(map, "add", matcher("a,(iy", ")"), 0xfd, 0x86, AdrMode.IMM8S);
  addGener(map, "add", matcher("a,", ""), 0xc6, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "adc", matcher("a," + r), 0x88 + i);
  for(let ixy of ixys) addImpl2(map, "adc", matcher("a," + ixy.r), ixy.p, 0x8c + ixy.o);
  addImpl2(map, "adc", matcher("hl,bc"), 0xed, 0x4a);
  addImpl2(map, "adc", matcher("hl,de"), 0xed, 0x5a);
  addImpl2(map, "adc", matcher("hl,hl"), 0xed, 0x6a);
  addImpl2(map, "adc", matcher("hl,sp"), 0xed, 0x7a);
  addGene2(map, "adc", matcher("a,(ix", ")"), 0xdd, 0x8e, AdrMode.IMM8S);
  addGene2(map, "adc", matcher("a,(iy", ")"), 0xfd, 0x8e, AdrMode.IMM8S);
  addGener(map, "adc", matcher("a,", ""), 0xce, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "sub", matcher(r), 0x90 + i);
  for(let ixy of ixys) addImpl2(map, "sub", matcher(ixy.r), ixy.p, 0x94 + ixy.o);
  addGene2(map, "sub", matcher("(ix", ")"), 0xdd, 0x96, AdrMode.IMM8S);
  addGene2(map, "sub", matcher("(iy", ")"), 0xfd, 0x96, AdrMode.IMM8S);
  addGener(map, "sub", matcher("", ""), 0xd6, AdrMode.IMM8);
  
  for(let [i, r] of regs.entries()) addImpli(map, "sbc", matcher("a," + r), 0x98 + i);
  for(let ixy of ixys) addImpl2(map, "sbc", matcher("a," + ixy.r), ixy.p, 0x9c + ixy.o);
  addImpl2(map, "sbc", matcher("hl,bc"), 0xed, 0x42);
  addImpl2(map, "sbc", matcher("hl,de"), 0xed, 0x52);
  addImpl2(map, "sbc", matcher("hl,hl"), 0xed, 0x62);
  addImpl2(map, "sbc", matcher("hl,sp"), 0xed, 0x72);
  addGene2(map, "sbc", matcher("a,(ix", ")"), 0xdd, 0x9e, AdrMode.IMM8S);
  addGene2(map, "sbc", matcher("a,(iy", ")"), 0xfd, 0x9e, AdrMode.IMM8S);
  addGener(map, "sbc", matcher("a,", ""), 0xde, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "and", matcher(r), 0xa0 + i);
  for(let ixy of ixys) addImpl2(map, "and", matcher(ixy.r), ixy.p, 0xa4 + ixy.o);
  addGene2(map, "and", matcher("(ix", ")"), 0xdd, 0xa6, AdrMode.IMM8S);
  addGene2(map, "and", matcher("(iy", ")"), 0xfd, 0xa6, AdrMode.IMM8S);
  addGener(map, "and", matcher("", ""), 0xe6, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "xor", matcher(r), 0xa8 + i);
  for(let ixy of ixys) addImpl2(map, "xor", matcher(ixy.r), ixy.p, 0xac + ixy.o);
  addGene2(map, "xor", matcher("(ix", ")"), 0xdd, 0xae, AdrMode.IMM8S);
  addGene2(map, "xor", matcher("(iy", ")"), 0xfd, 0xae, AdrMode.IMM8S);
  addGener(map, "xor", matcher("", ""), 0xee, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "or", matcher(r), 0xb0 + i);
  for(let ixy of ixys) addImpl2(map, "or", matcher(ixy.r), ixy.p, 0xb4 + ixy.o);
  addGene2(map, "or", matcher("(ix", ")"), 0xdd, 0xb6, AdrMode.IMM8S);
  addGene2(map, "or", matcher("(iy", ")"), 0xfd, 0xb6, AdrMode.IMM8S);
  addGener(map, "or", matcher("", ""), 0xf6, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "cp", matcher(r), 0xb8 + i);
  for(let ixy of ixys) addImpl2(map, "cp", matcher(ixy.r), ixy.p, 0xbc + ixy.o);
  addGene2(map, "cp", matcher("(ix", ")"), 0xdd, 0xbe, AdrMode.IMM8S);
  addGene2(map, "cp", matcher("(iy", ")"), 0xfd, 0xbe, AdrMode.IMM8S);
  addGener(map, "cp", matcher("", ""), 0xfe, AdrMode.IMM8);

  for(let [i, r] of regs.entries()) addImpli(map, "inc", matcher(r), 0x04 + (i * 8));
  addImpli(map, "inc", matcher("bc"), 0x03);
  addImpli(map, "inc", matcher("de"), 0x13);
  addImpli(map, "inc", matcher("hl"), 0x23);
  addImpli(map, "inc", matcher("sp"), 0x33);

  for(let [i, r] of regs.entries()) addImpli(map, "dec", matcher(r), 0x05 + (i * 8));
  addImpli(map, "dec", matcher("bc"), 0x0b);
  addImpli(map, "dec", matcher("de"), 0x1b);
  addImpli(map, "dec", matcher("hl"), 0x2b);
  addImpli(map, "dec", matcher("sp"), 0x3b);

  for(let [i, r] of regs.entries()) addImpl2(map, "rlc", matcher(r), 0xcb, 0x00 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "rrc", matcher(r), 0xcb, 0x08 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "rl", matcher(r), 0xcb, 0x10 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "rr", matcher(r), 0xcb, 0x18 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "sla", matcher(r), 0xcb, 0x20 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "sra", matcher(r), 0xcb, 0x28 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "sll", matcher(r), 0xcb, 0x30 + i);
  for(let [i, r] of regs.entries()) addImpl2(map, "srl", matcher(r), 0xcb, 0x38 + i);

  for(let [i, r] of regs.entries()) addBitOp(map, "bit", matcher("", "," + r), 0x40 + i);
  for(let [i, r] of regs.entries()) addBitOp(map, "res", matcher("", "," + r), 0x80 + i);
  for(let [i, r] of regs.entries()) addBitOp(map, "set", matcher("", "," + r), 0xc0 + i);

  for(let [i, r] of regs.entries()) if(r !== "(hl)") addImpl2(map, "in", matcher(r + ",(c)"), 0xed, 0x40 + (i * 8));
  addImpl2(map, "in", matcher("(c)"), 0xed, 0x70);
  addGener(map, "in", matcher("a,(", ")"), 0xdb, AdrMode.IMM8P);

  for(let [i, r] of regs.entries()) if(r !== "(hl)") addImpl2(map, "out", matcher("(c)," + r), 0xed, 0x41 + (i * 8));
  addImpl2(map, "out", matcher("(c),0"), 0xed, 0x71);
  addGener(map, "out", matcher("(", "),a"), 0xd3, AdrMode.IMM8P);

  addImpli(map, "push", matcher("bc"), 0xc5);
  addImpli(map, "push", matcher("de"), 0xd5);
  addImpli(map, "push", matcher("hl"), 0xe5);
  addImpli(map, "push", matcher("af"), 0xf5);
  addImpli(map, "pop", matcher("bc"), 0xc1);
  addImpli(map, "pop", matcher("de"), 0xd1);
  addImpli(map, "pop", matcher("hl"), 0xe1);
  addImpli(map, "pop", matcher("af"), 0xf1);

  addImpli(map, "jp", matcher("(hl)"), 0xe9);
  for(let [i, c] of conds.entries()) addGener(map, "jp", matcher(c + ",", ""), 0xc2 + (i * 8), AdrMode.ABS);
  addGener(map, "jp", matcher("", ""), 0xc3, AdrMode.ABS);

  for(let [i, c] of conds.entries()) addGener(map, "call", matcher(c + ",", ""), 0xc4 + (i * 8), AdrMode.ABS);
  addGener(map, "call", matcher("", ""), 0xcd, AdrMode.ABS);

  addGener(map, "djnz", matcher("", ""), 0x10, AdrMode.REL8);

  addGener(map, "jr", matcher("nz,", ""), 0x20, AdrMode.REL8);
  addGener(map, "jr", matcher("z,", ""), 0x28, AdrMode.REL8);
  addGener(map, "jr", matcher("nc,", ""), 0x30, AdrMode.REL8);
  addGener(map, "jr", matcher("c,", ""), 0x38, AdrMode.REL8);
  addGener(map, "jr", matcher("", ""), 0x18, AdrMode.REL8);

  addImpli(map, "ret", matcher(""), 0xc9);
  for(let [i, c] of conds.entries()) addImpli(map, "ret", matcher(c), 0xc0 + (i * 8));

  addRstOp(map, "rst", matcher("", ""), 0xc7);

  addImpl2(map, "im", matcher("0"), 0xed, 0x46);
  addImpl2(map, "im", matcher("1"), 0xed, 0x56);
  addImpl2(map, "im", matcher("2"), 0xed, 0x5e);

  addImpli(map, "ex", matcher("af,af'"), 0x08);
  addImpli(map, "ex", matcher("(sp),hl"), 0xe3);
  addImpli(map, "ex", matcher("de,hl"), 0xeb);
  addImpli(map, "exx", matcher(""), 0xd9);

  addImpli(map, "nop", matcher(""), 0x00);
  addImpli(map, "halt", matcher(""), 0x76);
  addImpli(map, "di", matcher(""), 0xf3);
  addImpli(map, "ei", matcher(""), 0xfb);

  addImpli(map, "rlca", matcher(""), 0x07);
  addImpli(map, "rla", matcher(""), 0x17);
  addImpli(map, "daa", matcher(""), 0x27);
  addImpli(map, "scf", matcher(""), 0x37);
  addImpli(map, "rrca", matcher(""), 0x0f);
  addImpli(map, "rra", matcher(""), 0x1f);
  addImpli(map, "cpl", matcher(""), 0x2f);
  addImpli(map, "ccf", matcher(""), 0x3f);

  addImpl2(map, "neg", matcher(""), 0xed, 0x44);
  addImpl2(map, "retn", matcher(""), 0xed, 0x45);
  addImpl2(map, "reti", matcher(""), 0xed, 0x4d);
  addImpl2(map, "rrd", matcher(""), 0xed, 0x67);
  addImpl2(map, "rld", matcher(""), 0xed, 0x6f);

  addImpl2(map, "ldi", matcher(""), 0xed, 0xa0);
  addImpl2(map, "cpi", matcher(""), 0xed, 0xa1);
  addImpl2(map, "ini", matcher(""), 0xed, 0xa2);
  addImpl2(map, "outi", matcher(""), 0xed, 0xa3);
  addImpl2(map, "ldir", matcher(""), 0xed, 0xb0);
  addImpl2(map, "cpir", matcher(""), 0xed, 0xb1);
  addImpl2(map, "inir", matcher(""), 0xed, 0xb2);
  addImpl2(map, "otir", matcher(""), 0xed, 0xb3);
  addImpl2(map, "ldd", matcher(""), 0xed, 0xa8);
  addImpl2(map, "cpd", matcher(""), 0xed, 0xa9);
  addImpl2(map, "ind", matcher(""), 0xed, 0xaa);
  addImpl2(map, "outd", matcher(""), 0xed, 0xab);
  addImpl2(map, "lddr", matcher(""), 0xed, 0xb8);
  addImpl2(map, "cpdr", matcher(""), 0xed, 0xb9);
  addImpl2(map, "indr", matcher(""), 0xed, 0xba);
  addImpl2(map, "otdr", matcher(""), 0xed, 0xbb);

  return map;
}

function addImpli(map: OpcodeMap, opcode: string, match: string[][], val: number): void {
  addItem(map, opcode, {match, adrs: [], vals: [val], argMap: [-1]});
}

function addImpl2(map: OpcodeMap, opcode: string, match: string[][], prefix: number, val: number): void {
  addItem(map, opcode, {match, adrs: [], vals: [prefix, val], argMap: [-1, -2]});
}

function addGener(map: OpcodeMap, opcode: string, match: string[][], val: number, mode: AdrMode): void {
  addItem(map, opcode, {match, adrs: [mode], vals: [val], argMap: [-1, 1]});
}

function addGene2(map: OpcodeMap, opcode: string, match: string[][], prefix: number, val: number, mode: AdrMode): void {
  addItem(map, opcode, {match, adrs: [mode], vals: [prefix, val], argMap: [-1, -2, 1]});
}

function addRstOp(map: OpcodeMap, opcode: string, match: string[][], val: number): void {
  let vals = [val, val + 0x8, val + 0x10, val + 0x18, val + 0x20, val + 0x28, val + 0x30, val + 0x38];
  addItem(map, opcode, {match, adrs: [AdrMode.RST], vals: [vals], argMap: [-1]});
}

function addBitOp(map: OpcodeMap, opcode: string, match: string[][], val: number): void {
  let vals = [val, val + 0x8, val + 0x10, val + 0x18, val + 0x20, val + 0x28, val + 0x30, val + 0x38];
  addItem(map, opcode, {match, adrs: [AdrMode.IMM3PO], vals: [0xcb, vals], argMap: [-1, -2]});
}

function addIxyIm(map: OpcodeMap, opcode: string, match: string[][], prefix: number): void {
  addItem(map, opcode, {match, adrs: [AdrMode.IMM8S, AdrMode.IMM8], vals: [prefix, 0x36], argMap: [-1, -2, 1, 2]});
}
