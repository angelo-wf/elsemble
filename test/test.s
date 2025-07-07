
; test file, checked for correct assembly, has to match given listing, symbols and output

; arcitecture tests

.db $12, $24 ; (emitting) directive before .arch is allowed

.include "arch/m6502.s"
.include "arch/w65816.s"
.include "arch/spc700.s"
.include "arch/z80.s"

.arch m6502
.org $8000

; line syntax tests

  lda #$12 ; comment
nop;no space
  .dw      lbl2  , lbl ;  ,cmt
    ldx      lbl3
  lda lbl4, x
asl
lsr   
  nop
.endscope
  .endscope  
; (endscope is always allowed)
lbl:jsr $2
  lbl2:  .db val, val2   
  lbl3:
lbl4:
val=12
val2 = 56;comment
  val3  :=   53;
val3:=3
;val3:=4
.db val3
.db "abc; no comment"; comment
.db ';', ',', 'a', '\'', 2
.db "\"\',\\\r\n\t\u{63}" ; "comment"
.db '\u{42}'

; expression tests

.db 6 * 8, $20 * %11
.db 8 / 2, 7 / 3
.db 6 % 2, 10 % 4
.db 7 + 5, -3 + 6
.db 6 - 5, 8 - 10
.db $20 << 2, 7 << 1
.db $40 >> %0101, -7 >> 2
.db %1100 & %1010, $37 & $f
.db %1100 | %1010, $40 | %10010
.db 3 ^ 2, %1100 ^ %1010
.db 6 < 5, 5 < 5, 4 < 5
.db $10 <= 17, %10001 <= $11, 18 < 17
.db 8 > 5, 5 > 5, -7 > 5
.db 6 >= 2, 2 >= 2, -1 >= 2
.db 3 == 3, 5 == 4
.db 7 != 5, 4 != 4
.db 2 && 3, 5 && 0, 0 && 0
.db 1 || 0, 3 || 5, 0 || 0
.db 1 ^^ 0, 2 ^^ 1, 0 ^^ 0

.db -5, -0
.db +4, +5
.db ~%1001, ~0
.db !5, !0, !1
.db ?7, ?$34, ?%0
.db <$1234, <-1
.db >$1234, >2
.db ^$123456, ^%100101100101010110101010
.dw &$654321, &$18023

.db "2" == 2, '2' == "2", "abc" == "abc"
.db "ab" != 5, "ab" != "ab", "ab" != "cd"
.db ?"a", ?"", ?"0"
.db +"abc"
.db "con" + "cat"
.db "a" && 0, "a" && 1

.db 16*4+(6-%100)
.db 2 + 3 * 4
.db (2 + 3) * 4
.db 6 << 2
.db 6 < <2
.db 2 - 3 - 4
.db 2 - (3 - 4)
.db 2 + 3 - 5
.db 21 % 10
.db ((6 / 2) * 3) % 6 + (5 - 2)
.db (5 & 1 | 6) ^ 2
.db 7 + 2 < 9, (6 * 2 | 3) + 1
.db 2 + 3 - 5^^^$12345

; directive tests

.include "dirs" + ".s"

; still 6502, even though file ends otherwise
lda #$a9

; testing some more practical/real world things

.include "practical.s"
