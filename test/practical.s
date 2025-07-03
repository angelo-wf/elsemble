
; overlapping allocation in ram

.macro orgMax, @a, @b
  .org (@a > @b) * @a | (@a <= @b) * @b
.endmacro

.org $0
.res 2

startSecA:
.res 3
endSecA:

.org startSecA
.res 4
endSecB:

!orgMax endSecA, endSecB
.res 2

startSecC:
.res 4
endSecC:

.org startSecC
.res 1
endSecD:

!orgMax endSecC, endSecD
.res 3

; aligning to end

.org $10000 - (alignEnd - alignStart)
alignStart:
.fill alignNum + 1
alignEnd:
.assert * == $10000, "should be the case"

alignNum = 7

; skipping half-banks

.macro crossCheck, @a
  .if >* != >@a
    .res $80
  .endif
.endmacro

.org $0780

crossA:
.fill $20
!crossCheck crossA

crossB:
.fill $70
!crossCheck crossB

crossC:
.fill $40
!crossCheck crossC

; macro with return

retVal := 0
.macro retMac, @a
  .db @a
  retVal := @a * 2
.endmacro

.dw valA, valB

!retMac 4
valA = retVal
!retMac 5
valB = retVal

; one-time include

.macro oti
  .ifndef otiDef
    otiDef := 1

    .db 12
  .endif
.endmacro

!oti
!oti

; fibonacci-sequence

fibRet := 0
.macro fib, @val
  .if @val < 2
    fibRet := 1
  .else
    !fib @val - 1
    @m1 = fibRet
    !fib @val - 2
    fibRet := fibRet + @m1
  .endif
.endmacro

.repeat 10, @i
  !fib @i
  .db fibRet ; first 10 terms
.endrepeat

; macros for sizes

.arch w65816
.smart on

.macro seta8
  sep #$20
.endmacro

.macro seta16
  rep #$20
.endmacro

lda #$12
!seta16
lda #$12
!seta8
lda #$12
