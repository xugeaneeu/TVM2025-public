# Lab 03: Arithmetic Expressions

[[RU](README.ru.md)|EN]

This excercise extends the [Lab 01](../lab01/README.md) to the full "school arithmetics" support, adding subtraction, division, unary negation, and variables to the expression language. The purpose of this is to get acquainted with the sophisticated features of the Ohm library, such as action parameters and left recursion support.

## Goal

The calculator implemented in this lab has a substantial difference to the two previous labs: an expression can contain variables, so we are no longer able to get the value straight out of it. We would need to supply *values* of the variables mentioned within expression.
A natural way to do it in TS/JS is via an *object*. Therefore, we will now call our `evaluate` function like this:

```typescript
const y = evaluate('x+a', {x: 41, a: 1});
```

The EBNF for the extended grammar looks like follows:

```EBNF
expr = 
    number
  | variable
  | "-" expr
  | expr "+" expr 
  | expr "*" expr
  | expr "-" expr
  | expr "/" expr

variable = letter { letter | digit }
number = digit { digit }
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
```

Note that this grammar requires additional disambiguation beyond operation priorities: the subtraction and division are *left-associative*.
`x + (y - z)` does not equal `(x + y) - z`. If there are no parentheses, our usual evaluation order rules require to perform the "left" operation before the "right" one.

## Tasks

1. Create a PEG grammar for the arithmetic expressions described by the EBNF above, using the Ohm library syntax.  
  The empty grammar template is supplied at the file [arith.ohm](src/arith.ohm). Fill it with the necessary rules.
2. Implement and export the composite function `evaluate(content: string): number` at [index.ts](src/index.ts) with the properties similar to the analogous function in the [Lab 01](../lab01/README.md).

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the basic parsing of the arithmetic expressions
  - Ensure the syntax errors are properly reported
  - Ensure that division by zero throws an exception
- B | 4 | Hurt Me Plenty:
  - Implement proper operation priorities and parentheses support
  - Make sure multiple application of the unary minus is supported (`--a`)
  - Make sure the division and subtraction are left-associative
- A | 5 | Ultra-Violence:
  - Implement the grammar without using left-recursive rules

## Hints

1. Handling left-associativity might be tricky. See the [assoc.md](assoc.md) for more detail.
2. Note that JS does not treat division by zero as an exception. By default it just yields `Infinity`.
