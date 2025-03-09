# Handling the Left Associativity in Infix Expressions

[[RU](./assoc.ru.md)|EN]

Naturally, PEG does support only the right recursion. Or, in other terms, the left recursion in PEG breaks the parsing process (see the [section in Wikipedia][PEG-LR] for more detail).

The Ohm library offers two solutions to this:

1. **Common approach**: replace the recursion with iteration, deal with the associativity on post-processing:

   ```js
   Hash = At ("#" At)* // no Hash mention on the right side of the rule
   ```

   An idiomaitic solution for the repetitions of this kind in Ohm is the built-in template rule:

   ```js
   Hash = NonemptyListOf<At, "#"> 
   ```

   This approach requires the parser author to either change the AST structure, so the `#` operation becomes N-ary instead of binary, or to convert the N-ary node parsed by this grammar into a binary parse tree within the semantic action:

   ```ts
   Hash(head, tail)
   {
      return tail.children
        .map(t => t.parse())
        .reduce((e, t) => sub(e, t), head.parse());
   }
   ```

2. **Ohm-specific** approach is based on the [article][Packrat-LR] published by the Ohm author - it *permits* the left recursion, unlike most other PEG parsers in the wild:

   ```js
   Hash = Hash "#" At | At // direct left recursion!
   ```

   This method offers the most convenience for the parser writer, as it allows to naturally express the left-associative binary operations without an extra burden of reducing the N-ary argument sequences into the binary parse trees.
   

[PEG-LR]: https://en.wikipedia.org/wiki/Parsing_expression_grammar#Indirect_left_recursion
[Packrat-LR]: https://tinlizzie.org/VPRIPapers/tr2007002_packrat.pdf