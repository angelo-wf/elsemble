
.arch spc700
.org 0

nop
bpl * + $14
clrp
bmi * + $14
setp
bvc * + $14
clrc
bvs * + $14
setc
bcc * + $14
ei
bcs * + $14
di
bne * + $14
clrv
beq * + $14

tcall 0
tcall 1
tcall 2
tcall 3
tcall 4
tcall 5
tcall 6
tcall 7
tcall 8
tcall 9
tcall 10
tcall 11
tcall 12
tcall 13
tcall 14
tcall 15

set1 $12,0
clr1 $12,0
set1 $12,1
clr1 $12,1
set1 $12,2
clr1 $12,2
set1 $12,3
clr1 $12,3
set1 $12,4
clr1 $12,4
set1 $12,5
clr1 $12,5
set1 $12,6
clr1 $12,6
set1 $12,7
clr1 $12,7

bbs $12,0, * + $37
bbc $12,0, * + $37
bbs $12,1, * + $37
bbc $12,1, * + $37
bbs $12,2, * + $37
bbc $12,2, * + $37
bbs $12,3, * + $37
bbc $12,3, * + $37
bbs $12,4, * + $37
bbc $12,4, * + $37
bbs $12,5, * + $37
bbc $12,5, * + $37
bbs $12,6, * + $37
bbc $12,6, * + $37
bbs $12,7, * + $37
bbc $12,7, * + $37

or a, $12
or a, $1234
or a, (x)
or a, ($12 + x)
or a, #$12
or $12, $34
or a, $12 + x
or a, $1234 + x
or a, $1234 + y
or a, ($12) + y
or $12, #$34
or (x), (y)

and a, $12
and a, $1234
and a, (x)
and a, ($12 + x)
and a, #$12
and $12, $34
and a, $12 + x
and a, $1234 + x
and a, $1234 + y
and a, ($12) + y
and $12, #$34
and (x), (y)

eor a, $12
eor a, $1234
eor a, (x)
eor a, ($12 + x)
eor a, #$12
eor $12, $34
eor a, $12 + x
eor a, $1234 + x
eor a, $1234 + y
eor a, ($12) + y
eor $12, #$34
eor (x), (y)

cmp a, $12
cmp a, $1234
cmp a, (x)
cmp a, ($12 + x)
cmp a, #$12
cmp $12, $34
cmp a, $12 + x
cmp a, $1234 + x
cmp a, $1234 + y
cmp a, ($12) + y
cmp $12, #$34
cmp (x), (y)

adc a, $12
adc a, $1234
adc a, (x)
adc a, ($12 + x)
adc a, #$12
adc $12, $34
adc a, $12 + x
adc a, $1234 + x
adc a, $1234 + y
adc a, ($12) + y
adc $12, #$34
adc (x), (y)

sbc a, $12
sbc a, $1234
sbc a, (x)
sbc a, ($12 + x)
sbc a, #$12
sbc $12, $34
sbc a, $12 + x
sbc a, $1234 + x
sbc a, $1234 + y
sbc a, ($12) + y
sbc $12, #$34
sbc (x), (y)

mov $12, a
mov $1234, a
mov (x), a
mov ($12 + x), a
cmp x, #$12
mov $1234, x
mov $12 + x, a
mov $1234 + x, a
mov $1234 + y, a
mov ($12) + y, a
mov $12, x
mov $12 + y, x

mov a, $12
mov a, $1234
mov a, (x)
mov a, ($12 + x)
mov a, #$12
mov x, $1234
mov a, $12 + x
mov a, $1234 + x
mov a, $1234 + y
mov a, ($12) + y
mov x, $12
mov x, $12 + y

or1 c, $1234,1
decw $12
or1 c, /$1234,1
incw $12
and1 c, $1234,1
cmpw ya, $12
and1 c, /$1234,1
addw ya, $12
eor1 c, $1234,1
subw ya, $12
mov1 c, $1234,1
movw ya, $12
mov1 $1234,1, c
movw $12, ya
not1 $1234,1
mov $12, $34

asl $12
asl $1234
asl $12 + x
asl a
rol $12
rol $1234
rol $12 + x
rol a
lsr $12
lsr $1234
lsr $12 + x
lsr a
ror $12
ror $1234
ror $12 + x
ror a

dec $12
dec $1234
dec $12 + x
dec a
inc $12
inc $1234
inc $12 + x
inc a
mov $12, y
mov $1234, y
mov $12 + x, y
dec y
mov y, $12
mov y, $1234
mov y, $12 + x
inc y

push psw
dec x
push a
inc x
push x
mov x, a
push y
mov a, x
mov y, #$12
mov x, sp
cmp y, #$12
mov sp, x
mov x, #$12
mov a, y
notc
mov y, a

tset $1234
cmp x, $1234
cbne $12, * + $37
cmp x, $12
tclr $1234
cmp y, $1234
dbnz $12, * + $37
cmp y, $12
pop psw
div ya, x
pop a
das a
pop x
cbne $12 + x, * + $37
pop y
dbnz y, * + $14

brk
jmp ($1234 + x)
bra * + $14
call $1234
pcall $12
jmp $1234
ret
reti
mov $12, #$34
xcn a
mov (x+), a
mov a, (x+)
mul ya
daa a
sleep
stop
