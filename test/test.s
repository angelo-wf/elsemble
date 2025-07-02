
; test file, checked for correct assembly, has to match given listing, symbols and output

; arcitecture tests

.db $12, $24 ; (emitting) directive before .arch is allowed

.include "arch/m6502.s"
.include "arch/w65816.s"
.include "arch/spc700.s"

.arch m6502
.org $8000

; line syntax tests

  lda #$12 ; comment
nop;no space
  .dw      lbl2  , lbl ;  ,cmt
    ldx      $34
asl
.endscope
; (endscope is always allowed)
lbl:jsr $2
  lbl2:  .db val, val2   
val=12
val2 = 56;comment
  val3  :=   53;
val3:=3
;val3:=4
.db val3
.db "abc; no comment"; comment
.db ';', ',', 'a', '\'', 2
.db "\"\',\\\r\n\t\u(63)" ; "comment"

; expression tests

.db 2 + 3 * 4
.db (2 + 3) * 4
.db 6 << 2, 257 >> 7
.db 6 < <2
.db 2 - 3 - 4
.db 2 - (3 - 4)
.db ((6 / 2) * 3) % 6 + (5 - 2)
.db 7 < 2, 7 > 5, 6 <= 6, 7 >= 5
.db 4 == 5, 2 == 2, 4 != 2, 6 != 6
.db (5 & 1 | 6) ^ 2
.db 3 & 1, 3 && 1, 3 || 1, 5 || 5
.db 1 ^^ 1, 0 ^^ 1
.db 7 + 2 < 9, (6 * 2 | 3) + 1
.db !4, ?4, ?0, -5
.db <$1234, >$1234, ^$123456
.dw &$764332
.db $fa, %11010100, ~%01101101, <~%11101101
.db 5 % 10, %10, 'a'
.db "con" + "cat"

; directive tests

.include "dirs" + ".s"

; still 6502, even though file ends otherwise
lda #$a9
