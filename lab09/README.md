# Lab 09: Compiling Funny

[[RU](README.ru.md)|EN]

The goal of this lab is to create the Funny compiler that targets Wasm.

## Goal

In this lab we will extend the front-end built in [previous lab](../lab08/README.md) with the backend producing Wasm code.

The code itself is going to be relatively straightforward. Note the following:

1. The variable references should be replaced by their indices in the function variable list.
   [Lab 05](../lab05/README.md) does partially handle this in regard to the function arguments.
   The local variables in Wasm are added to the same list as the parameters, i.e. in a function of 2 arguments local number 2 refers to the first local variable, 3 to the second one and so on. Assignment to a local var is done with the [`local.set`][local.set] instruction.
2. Funny language treats the return values of the function as the regular variables; so they should also be registered in the Wasm function header as locals.
3. At the end of the function we need to put the return values to the stack

## Tasks

1. Implement the `compileModule()` function that converts the Funny module into a WebAssembly module in [compiler.ts](src/compiler.ts).

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement support for the single-function modules
  - Implement support for the int arguments and return values
  - Implement support for the single-returning functions
  - Implement support for the assignment statements
  - Implement support for the block statements
  - Properly handle the comments
- B | 4 | Hurt Me Plenty:
  - Implement support for the functions with multiple return values
  - Implement support for multi-function modules
  - Implement support for the function calls in expressions
  - Implement support for the conditional statements
  - Implement support for the loop statements
- A | 5 | Ultra-Violence:
  - Implement support for the array parameters and return values
  - Implement support for the array element assignments
  - Implement support for the tuple assignments

[local.set]: https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/Variables/Local_set
