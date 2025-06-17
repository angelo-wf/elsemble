# Elsemble

Elsemble is a multipass assembler supporting the 6502, 65816 and spc700. Its mulitpass architecture means it keeps doing passes until all label have stable values. At that point any errors on that pass are shown, or the result is written. This allows using labels defined later in any math and expressions as if the were defined already.

## Usage

General CLI usage:
`elsemble [options] <infile> <outfile>`

### Options

| Short | Long | Argument | Description |
| - | - | - | - |
| `-a` | `--arch` | `<architecture>` | Set the initial achitecture to use |
| `-d` | `--define` | `<label>`, `<label=value>` | Define `label` to be `value` if given, or `1` otherwise |
| `-e` | `--expandlisting` | - | Expand macros and repeat statements in the listing file |
| `-h` | `--help` | - | Print help text |
| `-l` | `--listing` | `<filename>` | Create a listing file, listing each line with the PC and emitted data |
| `-p` | `--passlimit` | `<count>` | Set maximum amount of passes to try (default is 10) |
| `-s` | `--symbols` | `<filename>` | Create a symbol file, listing all labels in `name = val` format |
| `-v` | `--verbose` | - | Enable verbose mode, printing the start of each pass |

Short options that do not need arguments can be defined with one dash (e.g. `-ev`), and the 2 fixed arguments do not need to be at the end but can be places between options.

`-d`/`--define` can be used multiple times to set multiple labels. For other options the last given value applies.

Assembly files are strictly read as UTF-8, and textual output written as UTF-8.

## Syntax

Each assembly file is parsed line by line. Each line can be an assignment, an optionally labeled opcode, directive or macro, or just a optionally labeled empty line. `;` can be used for comments.

Assignments are in the form `label = value` for a regular label, or `label := value` for a redefinable label.

Directives start with a dot, and macro calls with an exclamation mark. They are followed by 0 or more arguments, separated by a comma. Macros need to be defined before use.

Opcodes generally use the expected syntax or each architecture. Assembly fails if an opcode is encuntered without an achitecture set through the directive or via the CLI-option.

Labeling a line can be done with a label followed by a colon before the opcode/directive/macro. Generally, except for between an opcode, directive or macro and its arguments, spacing does not matter.

Opcodes and directives are not case-sensitive, but macros and labels are.

### Labels

Labels can have numeric (integer) values, or string values. Labels defined using a labeled line get the value of the PC, and labels through assignment the given value.

Labels can normally not be redefined, but when assigned using the redefinition-syntax, they can be. All (re-)definitions need to use the redefinition-syntax. Unlike non-redefinable labels, they need to be defined before use.

There are several kinds of labels:
- Regular global labels, which just have a alphanumeric name (`global`).
- Local labels, which are a alphanumeric name preceded by a dot (`.local`). These are only directly usable between the global labels they are defined. Outside of this section, the global name can be prepended to reference it (`global.local`).
- Scoped labels, which are a `global` or `global.local` label preceded by an alphanumeric scope name and a colon (`scope:global.local`).
- Default scoped labels, which are `global` and `global.local` labels with just a preceding colon (`:global.local`). These are explicitly in the default scope.
- Block labels, alphanumeric preceded by a `@`, which can be used in repeat statements and macros (`@block`). They are unique to each loop through the repeat or each macro expansion. They are also used for the repeat counter and macro arguments.

'Alphanumeric' refers to a name consisting of upper- and lowecase letters, numbers, or underscores. They cannot start with a number.

There are also directive to set the scope. Defined `global` labels become part of the scope, and references search the current scope. For unscoped `global` and `global.local` labels, if it is not found within the scope, the default scope is also searched.

## Expressions

Whenever a value is needed, an expression can be used. These consist of values and operators.

### Values

Values can come in various forms:
- Numeric constants, where a `$`-prefix indicates a hexadecimal value, and `%` an binary value. No prefix means decimal.
- Character constants, which are enclosed in single quotes. These are parsed into numeric constants.
- String constants, which are a list of characters enclosed in double quotes, which parse into strings.
- Label names, which evaluate to the value of that label.
- The special value `*`, which evaluates to the PC at the start of the line where it is used.

Strings and character constants support escape sequences within them using a backslash, these are:
- `\n`: newline
- `\r`: carriage return
- `\t`: tab
- `\"`: double quote
- `\'`: single quote
- `\\`: backslash
- `\u(<value>)`: the Unicode charcter with codepoint `<value>`

The characters for character constants are mapped according to the currently set character mapping.

### Operators

A selection of binary and unary operators, as well as brackets (`()`) to force precedence ordering, are available.

| Unary operator | description |
| - | - |
| `~` | Bitwise not (invert bits) |
| `+` | Unary plus, a no-op |
| `-` | Negation |
| `!` | Logical not, 1 if the value is `0`, else 0 |
| `?` | Logical operator, 0 if the value is `0`, else 1 |
| `<` | Low byte, equivalent to `v & $ff` |
| `>` | High byte, equivalent to `v >> 8 & $ff` |
| `^` | Bank byte, equivalent to `v >> 16 & $ff` |
| `&` | Low word, equivalent to `v & $ffff` |

| Binary operator | level | description |
| - | - | - |
| `*` | 9 | Multiplication |
| `/` | 9 | Division, with truncation |
| `%` | 9 | Modulo |
| `+` | 8 | Addition |
| `-` | 8 | Subtraction |
| `<<` | 7 | Left shift |
| `>>` | 7 | Logical right shift |
| `&` | 6 | Bitwise and |
| `\|` | 5 | Bitwise or |
| `^` | 5 | Bitwise exclusive or |
| `<` | 4 | 1 if the first value is less than the second, else 0 |
| `<=` | 4 | 1 if the first value is less than or equal to the second, else 0 |
| `>` | 4 | 1 if the first value is greater than the second, else 0 |
| `>=` | 4 | 1 if the first value is greate than or equal to the second, else 0 |
| `==` | 3 | 1 if the values are equal, else 0 |
| `!=` | 3 | 1 if the values are not equal, else 0 |
| `&&` | 2 | Applies `?` to both values, then: 1 if both are 1, else 0 |
| `\|\|` | 1 | Applies `?` to both values, then: 1 if either or both is/are 1, else 0 |
| `^^` | 1 | Applies `?` to both values, then: 1 if they differ, else 0 |

The level indicates the precedence ordering. Within a level, binary operators are evaluated left-to-right.

Apart from the unary and binary `+`, equality, and logical operators, numbers are expected. Unary `+` leaves string unchanged, and binary `+` concatenates them. 

## Directives

Arguments in the descriptions use `<>` if they are required, and `[]` if they are optional. Expect for the names `label`, `name` and `blocklabel`, the arguments are expressions that are evaluated.

### Macros

Macros can be defined:

- `.macro <name>, [blocklabel, ...]`: Start a macro definition for the macro names `name`, needing the amount of arguments provided. The arguments are block labels which are defined when the macro is called.
- `.endmacro`: Ends a macro definiton.

Block-labels can be defined within a repeat statement and are unique per macro call.

Macros cannot be defined within other macros and cannot be redefined.

### Conditional assembly

Conditional assembly can be achieved using if-statements:

- `.if <test>`: Start an if-statement. The branch is taken if `test` is non-zero.
- `.elif <test>`: Test another expression. If it is non-zero and no branches have been taken yet, the branch is taken.
- `.else`: Start the else-branch. If no branch is taken yet, this branch is taken.
- `.endif`: Ends the if-statement.
- `.ifdef <label>`: If `label` is the name of a defined label, the branch is taken. Note that non-reassignable labels are considered defined even before their definition.
- `.ifndef <label>`: Like `.ifdef`, but taken if the label is not defined instead.

Additionally, it is possible to force an error depending on a expression to test:

- `.assert <test>, <message>`: If `test` is 0, gives an error using `message`.

### Repeating assembly

A section of assembly can be repeated multiple times using repeat-statements:

- `.repeat <count>, [blockabel]`: start a repeat-statement, repeating `count` (evaluated) times. If `blocklabel` is given, it is defined to be the iteration number for each loop through the repeat.
- `.endrepeat`: Ends a repeat-statement.

Block-labels can be defined within a repeat statement and are unique per loop through the repeat. Nested repeats can access those defined in outer repeats, if not shadowed by usign the same name in the inner repeat.

Repeat-statements need to start and end within the same file or macro.

### Including files or data

Files containing assembly, or data from binary files can be included:

- `.include <path>`: Includes the file at `path` as assembly.
- `.incbin <path>, [start], [count]`: Include binary data from the file at `path`. If `start` and `count` are privided, only includes `count` bytes starting from `start`. If count is omitted, goes to the end of the file. If both are omitted, includes the whole file.

Absolute paths (starting with `/`) work as expected. Paths starting with `./` are resolved as being relative to the working directory, other paths are relative to the including file. Includes within macros are relative to the file that defines the macro, not the file calling it.

### Setting and moving the PC

The PC can be set or moved without emitting bytes:

- `.org <location>`: Sets the PC to `location`, without any checks.
- `.res <amount>`: Reservers `amount` bytes of space, moving the PC forwards `amount` bytes.
- `.rpad <location>`: Moves the PC forwards to `location`, giving an error if it has to go backwards.
- `.align <value>`: Moves the PC to a multiple of `value`.

Or moved while emitting bytes:

- `.fillbyte <byte>`: Sets the current fill-byte. It defaults to 0.
- `.pad <location>, [fill]`: Moves the PC forward to `location`, emtting bytes and giving an error if it has to go backwards. `fill` is used to emit, or if omitted, the current fill-byte.
- `.fill <amount>, [fill]`: Emits `fill`, or the fill-byte if omitted, `amount` times.
- `.align <value>, [fill]`: Emits bytes to move the PC to a multiple of `value`, using `fill`, or the fill-byte if omitted.

### Defining data

Data can be defined:

- `.db <value>, [value, ...]`: Emit the given values as 8-bit bytes, or for string arguments, emits each character of the string using the current character mapping as a byte. Out-of-range values give an error.
- `.dw <value>, [value, ...]`: Emit the given values as 16-bit words, or for string arguments, emits each character of the string using the current character mapping (with range-check).
- `.dl <value>, [value, ...]`: Emit the given values as 24-bit longs, or for string arguments, emits each character of the string using the current character mapping (with range-check).

Range checks check if the value is in the range for the needed bit-size, allowing both interpreting as signed or unsigned (e.g. for 8-bit values, -128 to 255 are valid).

Defining data with automatic byte/word extraction can also be done:

- `.dlb <value>, [value, ...]`: Emit the given values as if `<` (low byte) is applied to each numeric argument or each character of the string.
- `.dhb <value>, [value, ...]`: Emit the given values as if `>` (high byte) is applied.
- `.dbb <value>, [value, ...]`: Emit the given values as if `^` (bank byte) is applied.
- `.dlw <value>, [value, ...]`: Emit the given values as if `&` (low word) is applied.

### Character mapping

Characters can be mapped:

- `.charmap <chars>, <startnum>`: Defines that the characters of `chars` should map to incrementing values starting from `startnum`. This replaces the default ASCII mapping, but can be used multiple times to map multiple different sets of characters.
- `clrcharmap`: Clear the defined character mapping, returning to default ASCII-mapping.

When character constants are evaluated, or string characters emitted, they are mapped according to the current character mapping. It defaults to mapping the 128 ASCII-characters. Using non-mapped characters gives an error.

### Scope

The current scope used for non-scoped labels can be set:

- `.scope <name>`: Set the scope to the name `name`.
- `.endscope`: Set the scope back to the defautl scope. Not required to switch to another named scope.

### Architecture

The current architecture and options relating to architectures can be set:

- `.arch <name>`: Set the architecture to `name`. This cannot be done inside if-statements or macros. Additionally, `.arch` inside an included file does not affect the architecture of the including file.
- `.smart <name>`: Enable or disable smart mode, which allows some architecture settings to be set by certain opcodes being assembled. `name` needs to be 'on' or 'off'.

Additionally, some architecture-specific directives exist, which are listed in the section about each architecture. These values are set per architecture and not shared between them.

The following architectures are valid:
- `m6502`: Assembles for the MOS 6502. Only documented opcodes are implemented.
- `w65816`: Assembles for the WDC 65816.
- `spc700`: Assembles for Sony's SPC700 core.

## Architectures

### MOS 6502

The assembler follows the general conventions for 6502 syntax. The following things are of note:
- The assembler uses the optimal form for opcodes with both zeropage and absolute forms.
  - A `.a` postfix on the opcode can be used to force absolute addressing when zeropage would otherwise be used.
- The `a` for accumulator addressing is optional (`lsr a` and `lsr` are equivalent).
- `brk` has an optional immediate argument. If provided, it is assembled as a 2-byte opcode using the argument instead of an one-byte opcode.

### WDC 65816

The assembler follows the general conventions for 65816 syntax. The following things are of note:
- The assembler has a address resolution system to allow the most optimal form for opcodes with multiple forms. Some postfixes on opcodes are available:
  - For direct-page opcodes, `.b` can be used to ignore address resolution and just use the argument as an 8-bit value to use.
  - For absoulte opcodes, `.w` can be used to ignore address resolution and just use the argument as an 16-bit value to use.
  - For opcodes with both direct page and absoulte forms, `.a` can be used to ignore the direct-page possibility, but still check and use absolute addressing.
  - For opcodes with DP, absolute and long forms, `.l` can be used to force long addressing.
- Opcodes that take an immediate based on regiser size can use `.b` and `.w` to force the size used.
- The `a` for accumulator addressing is optional (`dec a` and `dec` are equivalent).
- Jumps that can change banks have to use `jml`.
- `brk` and `cop` have an optional immediate arguments. If provided, it is assembled as a 2-byte opcode using the argument instead of an one-byte opcode.
- `wdm` has an immediate argument.
- `mvn` and `mvp` take banks in source, destination order, and do not use an immediate-`#`.

Some directives exist to handle immediates and address resolution:

- `.asize <val>`: Set the size the assembler uses for accumulator-based immediate arguments. The value has to be 8 or 16. It only sets internal state, and does not emit any opcodes to switch the size.
- `.isize <val>`: Set the size the assembler uses for index-based immediate arguments. The value has to be 8 or 16. It does not emit any opcodes.
- `.dirpage <val>`: Set the direct-page value used by the assembler for DP-address resolution (does not emit opcodes).
- `.bank <val>`: Set the databank value used by the assembler for absolute address resolution (does not emit opcodes).

Additionally, mirroring can be specified between banks, which allows resolving addresses across mirrored regions of memory:

- `.mirror <dst>, <start>, <end>, <src>, [srcend]`: Indicate mirroring between addresses `start` and `end` (inclusive), to bank `dst`, from banks `src` up to and including `srcend` if provided.
- `.clrmirror`: Clear all set mirrorings.

E.g. by using `.mirror $0, $0000, $5fff, $01, $3f`, addresses in the range $00:0000-$00:5fff are assembled as absolute, even when the databank is set to $01 to $3f. Note that mirroring is checked both ways, but not recursively (e.g. setting $01 and $02 as a mirror of $00 does not indicate mirroring between $01 and $02).

When smart mode is enabled, the internal state of the accumulator and index size is updated automatically when `rep` and `sep` opcodes are assembled.

### SPC700

The assemnler roughly uses the specified opcode formats, but does deviate in some places:
- The `!` to indicate absolute does not exists, instead the most optimal form is used for opcodes with both DP and absolute forms.
  - A `.a` postfix on opcodoes with DP and absolute forms can be used to force absolute addressing.
  - A `.b` postfix on DP-opcodes can be used to ignore address resolution and just use the argument as an 8-bit value.
- Round brackets `()` are consistently used for indirection.
- Post-increment puts the `+` within the brackets (`(x+)`).
- Bit-opcodes use a comma between the value and the bit (`set1 $12,3`, `and1 c, /$1234,4`) and not a dot.
- The bit-test opcodes do not end with `1` (`tset`, `tclr`).

The `.dirpage <value>` directive can be used to set the direct page value used for DP resolution to 0 or 256.

When smart mode is enabled, the direct page value is updated automatically when `setp` and `clrp` opcodes are assembled.
