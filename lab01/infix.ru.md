# Разбор инфиксных операций с приоритетами

[RU|[EN](README.md)]

The common way of expressing the infix operations priority in grammars is splitting the rules. When looking at a string like `x # y @ z # w`, where `#` and `@` are some infix binary operations, we see a sequence of *low priority* operations applied to the results of *high priority* operations. I.e. if `#`'s priority is higher, then this string would be read as "`@` applied to `x # y` and `z # w`".
If `#` has the lowest priority, then this string is read as "`#` applied to `x`, `y @ z` and `w`". Note we don't need to think of whether a `#`'s argument is an atom or a higher operation's result: we can see it as a "sequence of one or more atoms joined by `@`". For example, the number `42` in such a grammar would be seen as a "multiplication with a single factor", whereas `6*7` would be a "multiplication of two factors".

PEG offers a bunch of ways to handle the concept of a "sequence of one or more instances of something", but the most natural one is the recursion expressed as an alternative or an optional quantifier:

```js
Hash = At "#" Hash | At // alternative

Hash = At ("#" Hash)?   // quantifier
```

The `At` rule mentioned above can be defined in a similar way - in terms of the next higher-priority operation, and so on until we get to the atoms of our expression. In case we want to allow user manually overriding the operation priorities, we can add the parentheses support. The easiest way to think about parentheses is to consider the parenthesized expression a "composite atom". I.e. regardless of the operation priorities, the expression in parentheses is evaluated before applying the operation to the result: `(1+2)*3` equals to `(3)*3`. In grammar this is expressed as one of the alternatives for the atom definition:

```js
Atom = 
  | number 
  | variable 
  | ... 
  | "(" Expr ")" // the whole expression in its complexity
```
