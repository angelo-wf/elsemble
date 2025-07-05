
.org 0

.arch m6502

lda $12
lda.a $12
lda $1234
lda.a $1234


.arch w65816

.mirror $0, $0000, $5fff, $01, $3f
.mirror $80, $0000, $1fff, $81

lda $12
lda.a $12
lda $300012
lda $3456
lda $123456
lda $443456

.bank $20

lda $1234
lda $6010
lda.w $6010
lda $206010

.dirpage $0180

lda $185
lda $85
lda.b $85

.bank $40

lda $182
lda.l $182
lda $17f
lda $1234

.bank $80
lda $810000
.bank $81
lda $800000
.clrmirror
lda $800000

.org $20000

jmp $289ab
jmp.w $1234
jsr ($2cdef, x)
jsr.w ($abcd, x)

lda #0
ldx #0
.asize 16
lda #0
rep #$10 ; does not affect, smart is off
ldx #-1
.isize 16
lda #-1
ldx #-1
.asize 8
lda #0
.isize 8
ldx #-1

.smart on

lda #0
rep #$20
lda #0
ldx #0
rep #$30
ldx #0
sep #$20
ldx #0
lda #0
sep #$10
ldx #0

.smart off

rep #$30
lda #0
lda.b #0
lda.w #0


.arch spc700

mov a, $12
mov.a a, $12
setp ; not smart, ignored
mov a, $112
.dirpage $100
mov a, $12
mov.b a, $12
mov a, $112
mov a, $222
.dirpage 0

.smart on

mov a, $101
setp
mov a, $101
clrp
mov a, $101
mov a, $44

.smart off

setp
mov a, $112
