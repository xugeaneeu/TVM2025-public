# Lab 01: Addition and Multiplication

[[RU](README.ru.md)|EN]

The purpose of this excercise is to get familiar with the environment.

## Goal

You are going to implement a simple calculator over the  integer decimal numbers that supports addition and multiplication.
The grammar for the input strings is defined by the following [EBNF][EBNF] grammar:

```EBNF
expr = 
    number
  | expr "+" expr 
  | expr "*" expr 
  | "(" expr ")" ;

number = digit { digit } ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

This is a typical way one would describe the structure of the arithmetic expressions. For the sake of brevity, this definition omits the details that might be important for the user:

- The whitespace is never mentioned in the EBNF, but we intuitively expect it to be supported (ignored between the elements of the non-terminal rules)
- The actual numbers supported by our calculator would have limited length, even though EBNF description implies the digit sequences of non-limited length
- Even though EBNF definition above helps us to distinguish the definitely incorrect expressions from the grammatically correct ones, it leaves certain room for the interpretation. Naturally, user would expect the common precedence rules to be respected, so the expression of `1+2*3` yields `7`, not `9`.
All of these details have to be covered in the "production" grammar. Real-world compilers rarely if at all rely on the EBNF, though all the industruial grammar engines tend to be inspired by BNF flavors, and EBNF in particular.

For the rest of this course we will use the PEG - [Parsing Expression Grammars][PEG] - for the text parsing. Our particular flavor is provided by the [Ohm](https://ohmjs.org/) library that provides a few sophisticated features making it a good choice for the real-world applications. Some of these features would be consumed in the advanced sub-excercises of our course.

## Tasks

1. Create a PEG grammar for the arithmetic expressions described by the EBNF above, using the Ohm library syntax.  
  The empty grammar template is supplied at the file [addmul.ohm](src/addmul.ohm). Fill it with the necessary rules.

2. Implement the semantic action `calculate()` for this grammar that should return a `number` for a parsed expression.
  The empty definition for this action is supplied at the file [calculate.ts](src/calculate.ts). Fill it with the necessary rules.
3. Implement and export the composite function `parse(content: string): number` at [index.ts](src/index.ts). The function must
   - parse the input string via the grammar implemented in task 1
   - on a parsing failure throw the SyntaxException
   - on a parsing success apply the calculate semantic action implemented in task 2 to the parse result (match object) and return the action result to the caller

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the basic parsing of numbers, addition, and multiplication
  - Ensure the syntax errors are properly reported
- B | 4 | Hurt Me Plenty
  - Ensure the proper priority
  - Support optional parenthesis
  - Support the spaces/tabs/newlines within expressions

## Hints

1. Ohm does offer an [interactive editor](https://ohmjs.org/editor/) with debugger for their grammars. It would help with troubleshooting the failed tests.
2. Typescript does check the semantic actions against the grammar described in Ohm, but this requires the grammar type definition file to be up-to-date. Do not forget to peform `pnpm run build` (`Shift-Ctrl-B` in VS Code) after each edit to the .ohm file to update the type definitions. Otherwise the IDE would produce the irrelevant error messages.
3. Expressing operation priorities requires splitting the grammar into multiple rules, see [infix.md](infix.md) for detail.
4. When writing grammar, note that Ohm does automatically support space within the "syntactic" rules - the ones with names starting with a capital letter. See the [Syntactic vs Lexical Rules](https://ohmjs.org/docs/syntax-reference#syntactic-lexical) section in the Ohm Syntax Reference.

[EBNF]: https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
[PEG]: https://en.wikipedia.org/wiki/Parsing_expression_grammar
