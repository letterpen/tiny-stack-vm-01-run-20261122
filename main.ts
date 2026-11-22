// Tiny stack VM (ISA v1): runs every $MAKEFUN_INPUT_DIR/<id> program, writes stdout.bin + exit.txt.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IN = process.env.MAKEFUN_INPUT_DIR || '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function run(p, inp) {
  const s = new Int32Array(257), cs = new Int32Array(64), mem = new Int32Array(256), out = [];
  let sp = 0, cp = 0, pc = 0, n = 0, ii = 0;
  const L = p.length;
  for (;;) {
    if (n >= 1000000) return [10, out];
    if (pc < 0 || pc >= L) return [9, out];
    const op = p[pc];
    const ok = op < 8 || (op >= 0x10 && op <= 0x1e) || (op >= 0x20 && op <= 0x22)
      || (op >= 0x30 && op <= 0x34) || op === 0x40 || op === 0x41 || (op >= 0x50 && op <= 0x53);
    if (!ok) return [5, out];
    let im = 0;
    if (op === 1) im = 1; else if (op === 2) im = 4; else if (op >= 0x30 && op <= 0x33) im = 2;
    if (pc + 1 + im > L) return [9, out];
    let need = 0, gain = 0;
    if (op === 1 || op === 2 || op === 0x52) gain = 1;
    else if (op === 4) { need = 1; gain = 2; }
    else if (op === 6) { need = 2; gain = 3; }
    else if ((op >= 0x10 && op <= 0x16) || (op >= 0x18 && op <= 0x1a) || (op >= 0x1c && op <= 0x1e) || (op >= 0x20 && op <= 0x22)) { need = 2; gain = 1; }
    else if (op === 0x17 || op === 0x1b || op === 0x40) { need = 1; gain = 1; }
    else if (op === 0x41) need = 2;
    else if (op === 3 || op === 0x31 || op === 0x32 || op === 0x50 || op === 0x51 || op === 0x53) need = 1;
    else if (op === 5) { need = 2; gain = 2; }
    else if (op === 7) { need = 3; gain = 3; }
    if (sp < need) return [2, out];
    if (sp - need + gain > 256) return [3, out];
    n++;
    const q = pc;
    pc = q + 1 + im;
    const a = s[sp - 2], b = s[sp - 1];
    switch (op) {
      case 0: return [0, out];
      case 1: s[sp++] = (p[q + 1] << 24) >> 24; break;
      case 2: s[sp++] = p[q + 1] | (p[q + 2] << 8) | (p[q + 3] << 16) | (p[q + 4] << 24); break;
      case 3: sp--; break;
      case 4: s[sp] = s[sp - 1]; sp++; break;
      case 5: s[sp - 1] = a; s[sp - 2] = b; break;
      case 6: s[sp] = a; sp++; break;
      case 7: { const t = s[sp - 3]; s[sp - 3] = a; s[sp - 2] = b; s[sp - 1] = t; break; }
      case 0x10: s[sp - 2] = (a + b) | 0; sp--; break;
      case 0x11: s[sp - 2] = (a - b) | 0; sp--; break;
      case 0x12: s[sp - 2] = Math.imul(a, b); sp--; break;
      case 0x13: if (b === 0) return [4, out]; s[sp - 2] = (a / b) | 0; sp--; break;
      case 0x14: if (b === 0) return [4, out]; s[sp - 2] = a % b; sp--; break;
      case 0x15: if (b === 0) return [4, out]; s[sp - 2] = Math.floor((a >>> 0) / (b >>> 0)) | 0; sp--; break;
      case 0x16: if (b === 0) return [4, out]; s[sp - 2] = ((a >>> 0) % (b >>> 0)) | 0; sp--; break;
      case 0x17: s[sp - 1] = (-b) | 0; break;
      case 0x18: s[sp - 2] = a & b; sp--; break;
      case 0x19: s[sp - 2] = a | b; sp--; break;
      case 0x1a: s[sp - 2] = a ^ b; sp--; break;
      case 0x1b: s[sp - 1] = ~b; break;
      case 0x1c: s[sp - 2] = a << (b & 31); sp--; break;
      case 0x1d: s[sp - 2] = a >> (b & 31); sp--; break;
      case 0x1e: s[sp - 2] = (a >>> (b & 31)) | 0; sp--; break;
      case 0x20: s[sp - 2] = a === b ? 1 : 0; sp--; break;
      case 0x21: s[sp - 2] = a < b ? 1 : 0; sp--; break;
      case 0x22: s[sp - 2] = (a >>> 0) < (b >>> 0) ? 1 : 0; sp--; break;
      case 0x30: pc += (p[q + 1] | (p[q + 2] << 8)) << 16 >> 16; break;
      case 0x31: if (s[--sp] === 0) pc += (p[q + 1] | (p[q + 2] << 8)) << 16 >> 16; break;
      case 0x32: if (s[--sp] !== 0) pc += (p[q + 1] | (p[q + 2] << 8)) << 16 >> 16; break;
      case 0x33: if (cp >= 64) return [7, out]; cs[cp++] = pc; pc = (p[q + 1] | (p[q + 2] << 8)) & 0xffff; break;
      case 0x34: if (cp === 0) return [8, out]; pc = cs[--cp]; break;
      case 0x40: if (b < 0 || b > 255) return [6, out]; s[sp - 1] = mem[b]; break;
      case 0x41: if (b < 0 || b > 255) return [6, out]; mem[b] = a; sp -= 2; break;
      case 0x50: { const t = String(s[--sp]); if (out.length + t.length > 65536) return [11, out]; for (let i = 0; i < t.length; i++) out.push(t.charCodeAt(i)); break; }
      case 0x51: if (out.length >= 65536) return [11, out]; out.push(s[--sp] & 255); break;
      case 0x52: s[sp++] = ii < inp.length ? inp[ii++] : -1; break;
      case 0x53: return [s[--sp] & 255, out];
    }
  }
}

for (const d of readdirSync(IN, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()) {
  const dir = join(IN, d);
  const p = readFileSync(join(dir, 'program.bin'));
  let inp = Buffer.alloc(0);
  try { inp = readFileSync(join(dir, 'input.bin')); } catch {}
  const [exit, out] = run(p, inp);
  const od = join(OUT, d);
  mkdirSync(od, { recursive: true });
  writeFileSync(join(od, 'stdout.bin'), Buffer.from(out));
  writeFileSync(join(od, 'exit.txt'), exit + '\n');
}
