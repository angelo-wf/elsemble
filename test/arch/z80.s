
.arch z80
.org 0

nop
djnz * + $14
jr nz, * + $14
jr nc, * + $14
ld bc, $1234
ld de, $1234
ld hl, $1234
ld ix, $1234
ld iy, $1234
ld sp, $1234
ld (bc), a
ld (de), a
ld ($1234), hl
ld ($1234), ix
ld ($1234), iy
ld ($1234), a
inc bc
inc de
inc hl
inc sp
inc b
inc d
inc h
inc (hl)
dec b
dec d
dec h
dec (hl)
ld b, $12
ld d, $12
ld h, $12
ld ixh, $12
ld iyh, $12
ld (hl), $12
ld (ix + $12), $34
ld (iy + $12), $34
rlca
rla
daa
scf
ex af, af' ;'
jr * + $14
jr z, * + $14
jr c, * + $14
add hl, bc
add hl, de
add hl, hl
add hl, sp
ld a, (bc)
ld a, (de)
ld hl, ($1234)
ld ix, ($1234)
ld iy, ($1234)
ld a, ($1234)
dec bc
dec de
dec hl
dec sp
inc c
inc e
inc l
inc a
dec c
dec e
dec l
dec a
ld c, $12
ld e, $12
ld l, $12
ld ixl, $12
ld iyl, $12
ld a, $12
rrca
rra
cpl
ccf

ld b, b
ld b, c
ld b, d
ld b, e
ld b, h
ld b, ixh
ld b, iyh
ld b, l
ld b, ixl
ld b, iyl
ld b, (hl)
ld b, (ix + $12)
ld b, (iy + $12)
ld b, a
ld c, b
ld c, c
ld c, d
ld c, e
ld c, h
ld c, ixh
ld c, iyh
ld c, l
ld c, ixl
ld c, iyl
ld c, (hl)
ld c, (ix + $12)
ld c, (iy + $12)
ld c, a
ld d, b
ld d, c
ld d, d
ld d, e
ld d, h
ld d, ixh
ld d, iyh
ld d, l
ld d, ixl
ld d, iyl
ld d, (hl)
ld d, (ix + $12)
ld d, (iy + $12)
ld d, a
ld e, b
ld e, c
ld e, d
ld e, e
ld e, h
ld e, ixh
ld e, iyh
ld e, l
ld e, ixl
ld e, iyl
ld e, (hl)
ld e, (ix + $12)
ld e, (iy + $12)
ld e, a
ld h, b
ld h, c
ld h, d
ld h, e
ld h, h
ld ixh, ixh
ld iyh, iyh
ld h, l
ld ixh, ixl
ld iyh, iyl
ld h, (hl)
ld h, (ix + $12)
ld h, (iy + $12)
ld h, a
ld l, b
ld l, c
ld l, d
ld l, e
ld l, h
ld ixl, ixh
ld iyl, iyh
ld l, l
ld ixl, ixl
ld iyl, iyl
ld l, (hl)
ld l, (ix + $12)
ld l, (iy + $12)
ld l, a
ld (hl), b
ld (ix + $12), b
ld (iy + $12), b
ld (hl), c
ld (ix + $12), c
ld (iy + $12), c
ld (hl), d
ld (ix + $12), d
ld (iy + $12), d
ld (hl), e
ld (ix + $12), e
ld (iy + $12), e
ld (hl), h
ld (ix + $12), h
ld (iy + $12), h
ld (hl), l
ld (ix + $12), l
ld (iy + $12), l
halt
ld (hl), a
ld (ix + $12), a
ld (iy + $12), a
ld a, b
ld a, c
ld a, d
ld a, e
ld a, h
ld a, ixh
ld a, iyh
ld a, l
ld a, ixl
ld a, iyl
ld a, (hl)
ld a, (ix + $12)
ld a, (iy + $12)
ld a, a

add a, b
add a, c
add a, d
add a, e
add a, h
add a, ixh
add a, iyh
add a, l
add a, ixl
add a, iyl
add a, (hl)
add a, (ix + $12)
add a, (iy + $12)
add a, a
adc a, b
adc a, c
adc a, d
adc a, e
adc a, h
adc a, ixh
adc a, iyh
adc a, l
adc a, ixl
adc a, iyl
adc a, (hl)
adc a, (ix + $12)
adc a, (iy + $12)
adc a, a
sub b
sub c
sub d
sub e
sub h
sub ixh
sub iyh
sub l
sub ixl
sub iyl
sub (hl)
sub (ix + $12)
sub (iy + $12)
sub a
sbc a, b
sbc a, c
sbc a, d
sbc a, e
sbc a, h
sbc a, ixh
sbc a, iyh
sbc a, l
sbc a, ixl
sbc a, iyl
sbc a, (hl)
sbc a, (ix + $12)
sbc a, (iy + $12)
sbc a, a
and b
and c
and d
and e
and h
and ixh
and iyh
and l
and ixl
and iyl
and (hl)
and (ix + $12)
and (iy + $12)
and a
xor b
xor c
xor d
xor e
xor h
xor ixh
xor iyh
xor l
xor ixl
xor iyl
xor (hl)
xor (ix + $12)
xor (iy + $12)
xor a
or b
or c
or d
or e
or h
or ixh
or iyh
or l
or ixl
or iyl
or (hl)
or (ix + $12)
or (iy + $12)
or a
cp b
cp c
cp d
cp e
cp h
cp ixh
cp iyh
cp l
cp ixl
cp iyl
cp (hl)
cp (ix + $12)
cp (iy + $12)
cp a

ret nz
ret nc
ret po
ret p
pop bc
pop de
pop hl
pop af
jp nz, $1234
jp nc, $1234
jp po, $1234
jp p, $1234
jp $1234
out ($12), a
ex (sp), hl
di
call nz, $1234
call nc, $1234
call po, $1234
call p, $1234
push bc
push de
push hl
push af
add a, $12
sub $12
and $12
or $12
rst $00
rst $10
rst $20
rst $30
ret z
ret c
ret pe
ret m
ret
exx
jp (hl)
ld sp, hl
ld sp, ix
ld sp, iy
jp z, $1234
jp c, $1234
jp pe, $1234
jp m, $1234
; cb
in a, ($12)
ex de, hl
ei
call z, $1234
call c, $1234
call pe, $1234
call m, $1234
call $1234
; dd
; ed
; fd
adc a, $12
sbc a, $12
xor $12
cp $12
rst $08
rst $18
rst $28
rst $38

in b, (c)
in d, (c)
in h, (c)
in (c)
out (c), b
out (c), d
out (c), h
out (c), 0
sbc hl, bc
sbc hl, de
sbc hl, hl
sbc hl, sp
ld ($1234), bc
ld ($1234), de
; ed 63
ld ($1234), sp
neg
; ed 54
; ed 64
; ed 74
retn
; ed 55
; ed 65
; ed 75
im 0
im 1
; ed 66
; ed 76
ld i, a
ld a, i
rrd
; ed 77
in c, (c)
in e, (c)
in l, (c)
in a, (c)
out (c), c
out (c), e
out (c), l
out (c), a
adc hl, bc
adc hl, de
adc hl, hl
adc hl, sp
ld bc, ($1234)
ld de, ($1234)
; ed 6b
ld sp, ($1234)
; ed 4c
; ed 5c
; ed 6c
; ed 7c
reti
; ed 5d
; ed 6d
; ed 7d
; ed 4e
im 2
; ed 6e
; ed 7e
ld r, a
ld a, r
rld
; ed 7f

ldi
cpi
ini
outi
ldd
cpd
ind
outd
ldir
cpir
inir
otir
lddr
cpdr
indr
otdr

rlc b
rlc c
rlc d
rlc e
rlc h
rlc l
rlc (hl)
rlc a
rrc b
rrc c
rrc d
rrc e
rrc h
rrc l
rrc (hl)
rrc a
rl b
rl c
rl d
rl e
rl h
rl l
rl (hl)
rl a
rr b
rr c
rr d
rr e
rr h
rr l
rr (hl)
rr a
sla b
sla c
sla d
sla e
sla h
sla l
sla (hl)
sla a
sra b
sra c
sra d
sra e
sra h
sra l
sra (hl)
sra a
sll b
sll c
sll d
sll e
sll h
sll l
sll (hl)
sll a
srl b
srl c
srl d
srl e
srl h
srl l
srl (hl)
srl a

bit 0, b
bit 0, c
bit 0, d
bit 0, e
bit 0, h
bit 0, l
bit 0, (hl)
bit 0, a
bit 1, b
bit 1, c
bit 1, d
bit 1, e
bit 1, h
bit 1, l
bit 1, (hl)
bit 1, a
bit 2, b
bit 2, c
bit 2, d
bit 2, e
bit 2, h
bit 2, l
bit 2, (hl)
bit 2, a
bit 3, b
bit 3, c
bit 3, d
bit 3, e
bit 3, h
bit 3, l
bit 3, (hl)
bit 3, a
bit 4, b
bit 4, c
bit 4, d
bit 4, e
bit 4, h
bit 4, l
bit 4, (hl)
bit 4, a
bit 5, b
bit 5, c
bit 5, d
bit 5, e
bit 5, h
bit 5, l
bit 5, (hl)
bit 5, a
bit 6, b
bit 6, c
bit 6, d
bit 6, e
bit 6, h
bit 6, l
bit 6, (hl)
bit 6, a
bit 7, b
bit 7, c
bit 7, d
bit 7, e
bit 7, h
bit 7, l
bit 7, (hl)
bit 7, a

res 0, b
res 0, c
res 0, d
res 0, e
res 0, h
res 0, l
res 0, (hl)
res 0, a
res 1, b
res 1, c
res 1, d
res 1, e
res 1, h
res 1, l
res 1, (hl)
res 1, a
res 2, b
res 2, c
res 2, d
res 2, e
res 2, h
res 2, l
res 2, (hl)
res 2, a
res 3, b
res 3, c
res 3, d
res 3, e
res 3, h
res 3, l
res 3, (hl)
res 3, a
res 4, b
res 4, c
res 4, d
res 4, e
res 4, h
res 4, l
res 4, (hl)
res 4, a
res 5, b
res 5, c
res 5, d
res 5, e
res 5, h
res 5, l
res 5, (hl)
res 5, a
res 6, b
res 6, c
res 6, d
res 6, e
res 6, h
res 6, l
res 6, (hl)
res 6, a
res 7, b
res 7, c
res 7, d
res 7, e
res 7, h
res 7, l
res 7, (hl)
res 7, a

set 0, b
set 0, c
set 0, d
set 0, e
set 0, h
set 0, l
set 0, (hl)
set 0, a
set 1, b
set 1, c
set 1, d
set 1, e
set 1, h
set 1, l
set 1, (hl)
set 1, a
set 2, b
set 2, c
set 2, d
set 2, e
set 2, h
set 2, l
set 2, (hl)
set 2, a
set 3, b
set 3, c
set 3, d
set 3, e
set 3, h
set 3, l
set 3, (hl)
set 3, a
set 4, b
set 4, c
set 4, d
set 4, e
set 4, h
set 4, l
set 4, (hl)
set 4, a
set 5, b
set 5, c
set 5, d
set 5, e
set 5, h
set 5, l
set 5, (hl)
set 5, a
set 6, b
set 6, c
set 6, d
set 6, e
set 6, h
set 6, l
set 6, (hl)
set 6, a
set 7, b
set 7, c
set 7, d
set 7, e
set 7, h
set 7, l
set 7, (hl)
set 7, a
