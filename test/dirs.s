
fa = 5
fb = 6

.if fa == 5
  .db 1
.elif fb == 6
  .db 2
.else
  .db 3
.endif

.if fa == 8
  .db 4
.elif fb == 6
  .db 5
.else
  .db 6
.endif

.if 0
  .db 7
.else
  .db 8
.endif

.if fb != 6
  .if fa == 5
    .db 9
  .endif
.else
  .if fa == 6
    .db 10
  .else
    .db 11
  .endif
.endif

.ifdef fa
  .db 12
.else
  .db 13
.endif

.ifdef fc
  .db 14
.else
  .db 15
.endif

.ifndef fc
  .db 16
.else
  .db 17
.endif


.repeat ra
  .db 2
.endrepeat

ra = 4

.repeat 5, @i
  .db @i + 1
.endrepeat

.repeat 3, @i
  .db @i, @k
  @k = 6
  .repeat 2, @j
    .db @i, @j, @k
    @k = -1
  .endrepeat
.endrepeat

.repeat rb
  .db 1
.endrepeat

rb = 0


.macro ma, @b
  .db @b
.endmacro

.macro mb, @v, @c
  .repeat @c, @d
    .db @v, @d
  .endrepeat
.endmacro

.macro mc
  lda #$12 ; 6502 inherited from including file
.endmacro

!ma 3
!mb 4, 2
!mc


.org da

.pad $c010
.pad $c020, $ff
.pad db

.fill 16
.fill dc, <db

.align $20
.align db & $ff
.db 1
.align $10, $34

.fillbyte $ea
.pad $c100
.fill 11, dc + 3

.org 0

.rpad $100
.rpad db - ($c020 - $100)

.res 2
.res da - ($c000) + 1

.ralign 8

da = $c000
db = $c020
dc = 8

.db -1, 255, -128
.dw -2, 65535
.dw 'a', -32768
.dl -3, 1
.dl 16777215, -$800000
.dw **2

.dlb $1234
.dhb $1234
.dbb $561234
.dlw $561234

.incbin dname
.incbin dname, dcnt * 14
.incbin dname, dcnt * 2, dcnt

dname = "data.bin"
dcnt = $10


.org %0

g1:
  .db 1, .l1
.l1:
  .db 2, g1
g2:
  .db 3, .l1
.l1:
  .db 4, g1.l1

s1:g1:
  .db 5, s1:g1

.scope s2
g1:
  .db 16, g1.l1
.l1:
  .db 17, .l1
  .db g1, g2
.endscope

.db s2:g1.l1

.assert g1 == 0, "not hit"

.db "abcd"

.charmap "abcef", 5
.charmap "d", 16

.db "abcd"
.db "fe"

.clrcharmap

.db "abcd"

; tests for address resolution and architecture-specific directives
.include "./test/arch/adrres.s" ; cwd-relative path with './'

.arch spc700

div ya, x
