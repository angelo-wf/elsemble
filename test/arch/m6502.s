
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
nop #$12
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

stp
; 12
; 22
; 32
; 42
; 52
; 62
; 72
; 82
; 92
ldx #$12
; b2
; c2
; d2
; e2
; f2

slo ($12, x)
slo ($12), y
rla ($12, x)
rla ($12), y
sre ($12, x)
sre ($12), y
rra ($12, x)
rra ($12), y
sax ($12, x)
ahx ($12), y
lax ($12, x)
lax ($12), y
dcp ($12, x)
dcp ($12), y
isc ($12, x)
isc ($12), y

nop $12
nop $12, x
bit $12
; 34
; 44
; 54
; 64
; 74
sty $12
sty $12, x
ldy $12
ldy $12, x
cpy $12
; d4
cpx $12
; f4

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

slo $12
slo $12, x
rla $12
rla $12, x
sre $12
sre $12, x
rra $12
rra $12, x
sax $12
sax $12, y
lax $12
lax $12, y
dcp $12
dcp $12, x
isc $12
isc $12, x

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
; 89
sta $1234, y
lda #$12
lda $1234, y
cmp #$12
cmp $1234, y
sbc #$12
sbc $1234, y

asl
; 1a
rol
; 3a
lsr
; 5a
ror
; 7a
txa
txs
tax
tsx
dex
; da
nop
; fa

anc #$12
slo $1234, y
; 2b
rla $1234, y
alr #$12
sre $1234, y
arr #$12
rra $1234, y
xaa #$12
tas $1234, y
lxa #$12
las $1234, y
axs #$12
dcp $1234, y
; eb
isc $1234, y

nop $1234
nop $1234, x
bit $1234
; 3c
jmp $1234
; 5c
jmp ($1234)
; 7c
sty $1234
shy $1234, x
ldy $1234
ldy $1234, x
cpy $1234
; dc
cpx $1234
; fc

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
shx $1234, y
ldx $1234
ldx $1234, y
dec $1234
dec $1234, x
inc $1234
inc $1234, x

slo $1234
slo $1234, x
rla $1234
rla $1234, x
sre $1234
sre $1234, x
rra $1234
rra $1234, x
sax $1234
ahx $1234, y
lax $1234
lax $1234, y
dcp $1234
dcp $1234, x
isc $1234
isc $1234, x

; alt forms
asl a
rol a
lsr a
ror a
brk
