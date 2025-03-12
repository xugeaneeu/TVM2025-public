# Lab 05: Compiling to Wasm

[[RU](README.ru.md)|EN]

This excercise builds upon the grammar from the [Lab 03](../lab03/README.md) parsed via parser from [Lab 04] (../lab04/README.md) to build a mini-compiler for the arithmetic expressions into the WebAssembly instruction format.

## Goal

In this lab we will practice compiling the code into the Wasm bytecode. More info on the WebAssembly virtual machine can be found on the [Wasm Project homepage][wasm].
Note that we're steering away from the approach used in [Lab 03](../lab03/README.md) for the function arguments passing.
Passing arguments of the complex types (like dictionaries) to Wasm is cumbersome. It is much easier to pass a few numeric arguments.
Therefore we will try *inferring the function signature* from the body.
Idea is to list all the variables used in the expression (in the order of their appearance), and make them the function parameters:

- `42` compiles to a zero-argument function `f()`
- `42+h` compiles to a single-argument function `f(h)`
- `a+h` compiles to a two-argument function `f(a, h)`
- `a+h*a` compiles to a two-argument function `f(a, h)`

The process of building the parameters list should better be split into a separate function, so later we can replace it by a different implementation. Someday we might want to add some formal parameters to the function despite them not being used within its body; that's why we'd make this list an explicit parameter of the [`buildFunction`](src/compiler.ts) function.

Wasm VM is a 'stack machine with variables', just like [JVM] or [CLR].
I.e. all operations are performed on the stack. In some sense, we need to convert an infix expression into a Reverse Polish Notation studied at [Lab 02](../lab02/README.md). The [`wasm`](../wasm/) package served within this excercise course does hide this away to offer the better type safety when emitting Wasm code, but under the hood all arithmetics is applied to the stack values.
Constants are loaded to the stack as the immediate values within the bytecode instruction. The function arguments are loaded by index, so local number 0 refers to the first argument of the function, local number 1 refers to the second one, and so on.

The last value on the stack when function finishes becomes its return value.

## Tasks

1. Implement the function `getVariables` in [compiler.ts](src/compiler.ts) that builds the array of variable names used in an expression
2. Implement the function `wasm` in [compiler.ts](src/compiler.ts) that converts an expression AST into the Wasm bytecode

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the compilation of all the arithmetic expressions
  - Ensure the syntax errors are properly reported
  - Ensure that division by zero throws an exception
- B | 4 | Hurt Me Plenty:
  - Reference to an inexistent variable throws a `WebAssembly.RuntimeError`

## Hints

1. WebAssembly does support a range of numeric types, whereas JS (and so TS) does have just the `number` and `bigint`. In this lab we can assume the calculator operates over `i32` type, and ignore the fact JS's `number` is wider than that. WebAssembly implementation in `node.js` will auto-handle the data conversion. It is possible to use `i64`, but it would require extra burden on the return values conversion, as it would no longer fit into the `number` type.
2. Note that division by zero in WebAssembly throws an exception, so no need for specual-casing it as we used to do in Lab 03
3. The [`wasm`](../wasm/) package referenced in this lab is an imperfect copy of the [wasm-util] GitHub project. See the project's homepage for the samples and usage hints.

[wasm]: https://webassembly.org/
[JVM]: https://docs.oracle.com/javase/specs/jvms/se8/html/
[CLR]: https://www.ecma-international.org/wp-content/uploads/ECMA-335_6th_edition_june_2012.pdf
[wasm-util]: https://github.com/rsms/wasm-util
