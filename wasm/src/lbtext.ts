// Linear bytecode textual representation.
// https://github.com/WebAssembly/design/blob/master/TextFormat.md
//
import { uint8 } from './basic-types';
import { opcodes } from './info'
import { t, N,  OpCode, instr_atom, instr_imm1, instr_pre, instr_pre1, instr_imm1_post, instr_pre_imm, instr_pre_imm_post } from './ast'

// Maps opname to opcode
const opnames = new Map<string, OpCode>();

for (const opcodeString in opcodes) { 
  const opcode = Number.parseInt(opcodeString) as OpCode;
  opnames.set(opcodes[opcode], opcode);
};

export type Writer = (s :string)=>void

interface Ctx {
  writeln(depth: number, s:string): void
}

function readVarInt7(byte :uint8) {
  return byte < 64 ? byte : -(128 - byte)
}

function fmtimm(n :N) {
  switch (n.t) {
    case t.uint8:
    case t.uint16:
    case t.uint32:
    case t.varuint1:
    case t.varuint7:
    case t.varuint32:
    case t.varint32:
    case t.varint64:
    case t.float32:
    case t.float64: {
      return n.v.toString(10)
    }
    case t.varint7:       {
      return readVarInt7(n.v).toString(10)
    }
    case t.type: {
      switch (n.v) {
        case -1:    return 'i32'
        case -2:    return 'i64'
        case -3:    return 'f32'
        case -4:    return 'f64'
        case -0x10: return 'anyfunc'
        case -0x20: return 'func'
        case -0x40: return 'void' // aka empty_block
        default:
          throw new Error('unexpected type ' + n.t.toString())
      }
    }
    default:
      throw new Error('unexpected imm ' + n.t.toString())
  }
}

function fmtimmv(n :N[]) { // " A B" if n=[A,B]; "" if n=[] (leading space)
  return n.map(n => ' ' + fmtimm(n)).join('')
}

function visitOps(nodes :N[], c :Ctx, depth :number) {
  for (let n of nodes) {
    visitOp(n, c, depth)
  }
}

function visitOp(n: N, c: Ctx, depth: number) {
  // const tname = style(symname(n.t), '92')
  if(n instanceof instr_atom)
  {
      if (n.v == 0x0b/*end*/ || n.v == 0x05/*else*/) 
        depth--;
      c.writeln(depth, opcodes[n.v]);
      return;
  } else if(n instanceof instr_imm1)
  { 
      c.writeln(depth, opcodes[n.v] + ' ' + fmtimm(n.imm))
  } else if(n instanceof instr_pre)
  {
      visitOps(n.pre, c, depth)
      c.writeln(depth, opcodes[n.v])
  } else if(n instanceof instr_pre1)
  {
      visitOp(n.pre, c, depth)
      c.writeln(depth, opcodes[n.v])
  } else if(n instanceof instr_imm1_post)
  {
      c.writeln(depth, opcodes[n.v] + ' ' + fmtimm(n.imm))
      visitOps(n.post, c, depth + 1)
  } else if(n instanceof instr_pre_imm)
  {
      visitOps(n.pre, c, depth)
      c.writeln(depth, opcodes[n.v] + fmtimmv(n.imm))
  } else if (n instanceof instr_pre_imm_post)
  {
      visitOps(n.pre, c, depth)
      c.writeln(depth, opcodes[n.v] + fmtimmv(n.imm))
      visitOps(n.post, c, depth + 1)
  }
  else throw new Error('unexpected op ' + n.t.toString());
}

export function printCode(instructions: N[], writer: Writer) {
  const ctx = {
    writeln(depth :number, chunk :string) {
      writer("  ".repeat(depth) + chunk + '\n')
    },
  }
  visitOps(instructions, ctx, 0)
}
