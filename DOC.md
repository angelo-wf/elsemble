# Elsemble

Elsemble is a multipass assembler supporting the 6502, 65816 and spc700. Its mulitpass architecture means it keeps doing passes until all label have stable values. At that point any errors on that pass are shown, or the result aew written. This allows using labels defined later in any math and expressions as if the were defined already.

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

## Syntax

Each assembly file is parsed line by line. Each line can be an assignment, an optionally labeled opcode, directive or macro, or just a optionally labeled empty line. `;` can be used for comments.

Assignments are in the form `label = value`, or `label := value` for a re-assignable label.

Directives start with a dot, and macro calls with an exclamation mark. They are followed by 0 or more arguments, separated by a comma. Macros need to be defined before use.

Opcodes generally use the expected syntax or each architecture. Assembly fails if an opcode is encuntered without an achitecture set through the directive or via the CLI-option.

Labeling a line can be done with a label followed by a colon before the opcode/directive/macro. Generally, except for between an opcode, directive or macro and its arguments, spacing does not matter.

Opcodes and directives are not case-sensitive, but macros and labels are.

### Labels

Labels can have numeric (integer) values, or string values. Labels defined using a labeled line get the value of the PC, and labels through assignment the given value.

Labels can normally not be redefined, but when assigned using the re-assignment syntax, they can be. All (re-)assignments need to use the re-assignment syntax. Unlike non-redefinable labels, they need to be defined before use.

- Regular global labels, which just have a alphanumeric name (`global`).
- Local labels, which are a alphanumeric name preceded by a dot (`.local`). These are only directly usable between the (scoped) global labels they are defined. Outside of this section, the global name (and scope) can be prepended to reference it (`global.local`).
- Scoped labels, which are a `global` or `global.local` label preceded by the scope name and a colon (`scope:global.local`).
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
| `%` | 9 | Modulus |
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


