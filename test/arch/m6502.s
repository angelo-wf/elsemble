
.arch m6502
.org 0

brk #$12
bpl * + $14
jsr $1234
bmi * + $14
rti
bvc * + $14
rts
bvs * + $14
bcc * + $14
ldy #$12
bcs * + $14
cpy #$12
bne * + $14
cpx #$12
beq * + $14

ora ($12, x)
ora ($12), y
and ($12, x)
and ($12), y
eor ($12, x)
eor ($12), y
adc ($12, x)
adc ($12), y
sta ($12, x)
sta ($12), y
lda ($12, x)
lda ($12), y
cmp ($12, x)
cmp ($12), y
sbc ($12, x)
sbc ($12), y

ldx #$12

bit $12
sty $12
sty $12, x
ldy $12
ldy $12, x
cpy $12
cpx $12

ora $12
ora $12, x
and $12
and $12, x
eor $12
eor $12, x
adc $12
adc $12, x
sta $12
sta $12, x
lda $12
lda $12, x
cmp $12
cmp $12, x
sbc $12
sbc $12, x

asl $12
asl $12, x
rol $12
rol $12, x
lsr $12
lsr $12, x
ror $12
ror $12, x
stx $12
stx $12, y
ldx $12
ldx $12, y
dec $12
dec $12, x
inc $12
inc $12, x

php
clc
plp
sec
pha
cli
pla
sei
dey
tya
tay
clv
iny
cld
inx
sed

ora #$12
ora $1234, y
and #$12
and $1234, y
eor #$12
eor $1234, y
adc #$12
adc $1234, y
sta $1234, y
lda #$12
lda $1234, y
cmp #$12
cmp $1234, y
sbc #$12
sbc $1234, y

asl
rol
lsr
ror
txa
txs
tax
tsx
dex
nop

bit $1234
jmp $1234
jmp ($1234)
sty $1234
ldy $1234
ldy $1234, x
cpy $1234
cpx $1234

ora $1234
ora $1234, x
and $1234
and $1234, x
eor $1234
eor $1234, x
adc $1234
adc $1234, x
sta $1234
sta $1234, x
lda $1234
lda $1234, x
cmp $1234
cmp $1234, x
sbc $1234
sbc $1234, x

asl $1234
asl $1234, x
rol $1234
rol $1234, x
lsr $1234
lsr $1234, x
ror $1234
ror $1234, x
stx $1234
ldx $1234
ldx $1234, y
dec $1234
dec $1234, x
inc $1234
inc $1234, x
