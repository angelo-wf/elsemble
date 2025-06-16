# Elsemble

A multipass assembler (currently) supporting the 6502 (documented opcodes only), 65816 and spc700, written in Typescript.

## Compilng and running

Requires `node` and `npm`

- `npm install`
- `npm run tsc`
- `node build/main.js`

## Documentation

See `DOC.md`

Note that the exact syntax is not fully finalized and may change.

## Future work

- Proper path handling (e.g. current solution is not fully functional on Windows)
- Tokenisation of argument strings before parsing (move opcode parsing away from current regexp-approach), and general parsing improvements
- Functions (e.g. `min`, `strlen`, `select`, `slice`, `dec`)
- Dynamic label definition to/from string (`.define "name", 12`, `lbl("name")`)
- Anonymous labels? (`:`, can be referred to with `:+[+...]`, `:-[-...]`)
- Custom functions? (`.function myFunc 2 \1*\2`, `%myFunc(3, 4)`)
