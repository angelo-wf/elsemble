# Elsemble

A multipass assembler (currently) supporting the 6502, 65816, SPC700 and Z80, written in Typescript.

## Compilng and running

Requires `node` and `npm`

Compile:
- `npm install`
- `npm run tsc`

Run:
- `node build/main.js` (or `npm start --` to compile as well)

Run tests:
- `node build/test.js` (or `npm test`)

## Documentation

See `DOC.md` for CLI arguments and assembly syntax/directves.

Note that the exact syntax is not fully finalized and may change.

## Future work

- Functions (e.g. `min`, `strlen`, `select`, `slice`, `dec`, `asize`)
- Dynamic label definition to/from string (`.define "name", 12`, `lbl("name")`)
- Better tests (error cases, CLI arguments)
- Restructuring files and imports
- Allow running easier
- API for use in other node-apps?
- More directives? (e.g. while loops?)
- Anonymous labels? (`:`, can be referred to with `:+[+...]`, `:-[-...]`)
- Custom functions? (`.function myFunc 2 \1*\2`, `%myFunc(3, 4)`)
