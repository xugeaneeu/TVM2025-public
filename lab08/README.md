# Lab 08: Parsing Funny

[[RU](README.ru.md)|EN]

The goal of this lab is to create a parser for a tiny imperative language named Funny, and to practice in
the grammar inheritance / reuse offered by the Ohm library.

## Goal

In this lab we will build a complete front-end for the subset of the toy language named Funny.
See the [funny.md](../funny.md) for the detailed description of the Funny syntax.
In this lab we will ignore all the Funny parts related to the verification:

1. The functions pre- and post-conditions
2. Loop invariants
3. Formula definitions

Note that in [Lab 03](../lab03/README.md) the [arithmetics grammar](../lab03/src/arith.ohm) has been build from scratch, even though the rules there are quite similar to the ones used in the [Lab 01](../lab01/README.md)'s [AddMul grammar](../lab01/src/addmul.ohm).

The Ohm library offers a better way of handling the grammar relations, allowing the parser authors to reuse and extend upon the proven grammars.
This lab is prepared to do just this: the language grammar is put into a [template file](./src/funny.ohm.t), which is glued at the build step to the grammar borrowed from the [Lab 03](../lab03/README.md). Refer to the [Grammar Inheritance](https://ohmjs.org/docs/syntax-reference#grammar-inheritance) section in the Ohm syntax reference for more detail on the rules reuse, extension, and redefinition.

## Tasks

1. Describe the Funny syntax as a PEG grammar in the [funny.ohm.t](./src/funny.ohm.t) file
2. Describe the Funny AST node types at [funny.ts](./src/funny.ts)
3. Implement the `parse()` semantic action for the grammar defined in #1 above in the [parser.ts](./src/parser.ts) file
4. Implement the function `parseFunny()` in the [parser.ts](./src/parser.ts) file

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the parsing of the limited Funny syntax, including:
    - Single-function modules
    - Int arguments and return values
    - Single-returning functions
    - Assignment statements
    - Block statements
  - Report syntax errors
  - Report the basic semantic errors:
    - Variable redefinition
    - Undeclared identifier
- B | 4 | Hurt Me Plenty:
  - Implement support for the additional Funny constucts:
    - Functions with multiple return values
    - Multi-function modules
    - Function calls in expressions
    - Conditional statements
    - Loop statements
  - Implement the type safety validation:
    - Assignment target type(s) must match the source expression type(s)
    - Arithmetic operators must be applied only to the integer expressions
    - Array access operators must be applied only to the array expressions
    - Function call argument types and number must match the function parameter list
- A | 5 | Ultra-Violence:
  - Implement support for the full Funny syntax except for the annotation-related constructs:
    - Array parameters and return values
    - Array element assignments
    - Tuple assignments
  - Report the error location in semantic errors
  - Add the warnings reporting on unused variables and parameters
  