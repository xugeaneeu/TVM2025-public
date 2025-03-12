# Lab 10: Parsing Funny Annotations

[[RU](README.ru.md)|EN]

The goal of this lab is to extend the Funny parser implemented in [Lab 08](../lab08/README.md) to support the formulas and annotations.

## Goal

In this lab we will extend the front-end built in [Lab 08](../lab08/README.md) to support the Funny syntax related to  verification.
Again, we're going to inherit most of the grammar from that lab to minimize the amount of work to be done.
The build process will concatenate the ancestor grammar to the one defined in [funnier.ohm.t](src/funnier.ohm.t) before processing it with the Ohm toolchain. Since the number of additional language constructs is not that large, the volume of the grammar additions is also expected to be moderate.

## Tasks

1. Write the additional and updated grammar rules into [funnier.ohm.t](src/funnier.ohm.t)
2. Define the additional AST nodes in [funnier.ts](src/funnier.ts)
3. Implement the semantic action `parse()` in [parser.ts](src/parser.ts)
4. Implement the semantic validation of the parsed AST in `resolveModule()` at [resolver.ts](src/resolver.ts)

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement support for the Funny annotations specified as *conditions*
- B | 4 | Hurt Me Plenty:
  - Implement support for the quantifiers in predicates
- A | 5 | Ultra-Violence:
  - Implement support for the formula definitions and references
