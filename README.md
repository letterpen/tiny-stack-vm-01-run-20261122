# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/letterpen/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/letterpen/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A single-file interpreter for make.fun's tiny stack ISA, written from the ISA
spec alone. One `main.ts` (Node stdlib only) runs all 40 instances: it reads
`program.bin` + `input.bin` per instance and writes `stdout.bin` + `exit.txt`.
Values are signed 32-bit with wrapping arithmetic (`Math.imul` for MUL);
traps keep prior output and exit with their trap code. Practice set:
1,000,000/1,000,000 (40/40 instances, stdout + exit exact), ~1 s for the set.
