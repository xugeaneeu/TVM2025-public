# Lab 02: Reverse Polish Notation

[[RU](README.ru.md)|EN]

The purpose of this excercise is to practice creating the grammars for micro-languages and attaching multiple semantic actions to the single grammar.

## Goal

You are going to implement a calculator that supports addition and multiplication written in the [Reverse Polish Notation][RPN] (RPN).
The "regular" arithmetic expressions implemented in the [previous lab](../lab01/README.md) do use so-called *infix* form, where the operator is placed *between* the operands. The Reverse Polish Notation places the operator *after* the operands, so it uses a *postfix* notation.

Don't confuse it with the Polish Notation, where the operator is placed *before* the operands.

The grammar for the RPN expressions is defined by the following EBNF:

```EBNF
rpnExpr = 
    number
  | rpnExpr rpnExpr "+" 
  | rpnExpr rpnExpr "*" 

number = digit { digit } ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
```

Note that this grammar does not need any kind of parentheses or priority rules: the order of operations is unambiguously defined by the placement of the arguments and operators. This notation is easily applicable to the stack-based evaluation machine, because each operation directy maps to the sequence of "push argument 1 to the stack; push argument 2 to the stack; apply operation". This pops both operands from stack, and pushes back the result of the operation. The maximum required stack depth is an important property of an RPN expression, since it affects the calculation performance.

## Tasks

1. Create a PEG grammar for the arithmetic expressions described by the EBNF above, using the Ohm library syntax.  
  The empty grammar template is supplied at the file [rpn.ohm](src/rpn.ohm). Fill it with the necessary rules.
2. Implement and export the composite function `evaluate(content: string): number` at [index.ts](src/index.ts) with the properties similar to the analogous function in the [previous lab](../lab01/README.md).
3. Implement and export the function `maxStackDepth(content: string): number` at [index.ts](src/index.ts) that returns the max stack depth required for a valid RPN expression or throws a `SyntaxError` for an invalid input.

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the basic parsing of the RPN expressions
  - Ensure the syntax errors are properly reported
- B | 4 | Hurt Me Plenty:
  - Implement the stack depth calculation

## Hints

1. Max stack depth can be defined similar to the value calculation - as a separate semantic action for the RPN grammar.
2. When measuring the stack depth, one would need both max stack depth of an argument and the remaining stack depth after the argument is calculated. This can be done by implementing *two* semantic actions/attributes, or as a single one returning a composite type (an [interface] or a [tuple].

[RPN]: https://en.wikipedia.org/wiki/Reverse_Polish_notation
[interface]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces
[tuple]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
