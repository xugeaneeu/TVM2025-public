# Lab 07: Algebraic Simplification

[[RU](README.ru.md)|EN]

The goal of this excercise is to get some idea on the optimizations performed by the modern compilers.
More specifically, we will practice *algebraic* optimizations.

## Goal

The [previous lab](../lab06/README.md) contains a subtask that performs a limited subset of *expression optimizations*. Since we know for sure that multiplying any `x` by `1` yields `x`, and multiplying by `0` yields `0`, in both cases we don't need to perform the multiplication *despite the runtime value* of `x`.

Intuitively, we expect the "shorter" form of the expression to be more efficient, as it requires less operations to be performed. In a more general case, though, the decision might be not so obvious: the number of operations might be the same, but their efficiency might differ. Some of the real-world compilers do contain quite sophisticated models of the target processors to make the educated decisions on the optimization choices.

We will formalize this as a special function `cost` that should assign every expression a non-negative integer value; the less is this value the "more optimal" the expression is.

Next, we will extend the naive approach taken in [previous lab](../lab06/README.md) to a broader set of identities - e.g. whenever we see an expression that has the form `x - x` we can replace it by `0`, and so on. However, hardcoding every addition to this list of identities makes our simplification code more and more complicated.
How can we be (reasonably) sure that we have exhausted all the optimization possibilities?

Another issue is an applicability of the identities. The real programs are not limited to operate on the integers; there might be some other data types where the list of identities is different. It seems counterproductive to write a separate algorithm per every datatype to, say, optimize the vector/matrix operations, or floating-point operations, or timestamp/interval operations and so on.

Implementing a general simplification algorithm that doesn't rely on any specific identities addresses both challenges.

That's what we're going to do in this lab.

The simplification function would take the source `Expr` and the set of identities (array of tuples `[Expr, Expr]`). It should return the *simplified* expression, i.e. the one that does reach the minimum value of the `cost` function.

## Tasks

1. Implement the `cost` function in [cost.ts](/src/cost.ts) that assigns the cost to an expression according to the following rules:
   - cost of the constant is zero
   - cost of the variable reference is one
   - cost of the unary negation is 1 + the argument cost
   - cost of the binary operation is 1 + the costs of each of the arguments
2. Implement the `simplify` function in [simplify.ts](src/simplify.ts) that simplifies the specified expression according to the specified set of identities

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Implement the simplification, assuming the identities do always decrease the expression cost, and are always well-formed
- B | 4 | Hurt Me Plenty:
  - Implement the simplification, assuming the identities do never increase the expression cost
  - Before simplification, verify that all specified identities
    - are well-formed (the set of variables used on both sides of the identity is the same)
    - do never increase the expression cost (and reverse the identities that do increase)
- C | 5 | Ultra-Violence:
  - Implement the simplification, permitting temporary increase of the expression cost
  - Use every identity in both directions (e.g. `a * (b+c) => a*b + a*c` is also  `a*b + a*c => a * (b+c)`)
  - Add the constant-folding to achieve additional optimization (if all the arguments of some sub-expression are constants, the sub-expression can be replaced by a single constant value calculated at compile-time)

## Hints

1. Regardless of the algorithm and approach used, the key components are:
   - Decision on whether a given identity does apply to the specific sub-expression
   - Transforming a sub-expression according to the applicable identity

   When dealing with these subtasks, remember the following:
   - an identity pattern specified as an expression (e.g. `x + x`) matches an expression whenever the *operation* is the same, and each of the arguments does match. Variable reference in the pattern matches *any* expression as long as all the same-name references are bound to the *same* subexpression. So, `42+42` does match the pattern above, `42+1` doesn't. Both `(a*2) + (a*2)` and `y + y` do match the same pattern, while `(2*a) + (a*2)` - doesn't.
   - in order to perform the transformation, we need to know which sub-expression is matched by every variable mentioned in the pattern. It makes sense to combine the process of verifying the pattern match with the process that builds this correspondence
2. Remember that single application of an identity transformation does not necessarily get the best solution. The transformed expression can be subject to additional transformation by some other identities, and so on.

3. Once the restriction "use only always-improving transformations" is lifted, some identities can be applied to a subexpression over and over again, leading to the cycles. Simple cycles are obvious (`x + y => y + x => x + y`), others can be more complicated and even involve several different identities (`a + (b + c) => b + (c + a) => c + (a + b) => a + (b + c)`). The proper solution must take this into account and prevent endless looping over the same expression form.
