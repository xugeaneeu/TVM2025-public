# Building AST in Typescript

The notable property of the Abstract Syntax Trees is their *heterogeneity* - i.e. the nodes of the single tree can belong to different types (though they might share some common attributes or behavior).
Different languages offer different concepts that can be used to describe the AST nodes.

**Object-oriented** languages tend to represent the AST node type as a hierarchy of classes with a single root or with a few roots.
This approach offers the easiest way to extend the type set - i.e. if we want to add a `Variable` node type to our `Expr` type, we could just inherit it correspondingly:

```ts
class Variable extends Expr {
//    ...
}
```

However, the price of this is lack of compiler support in exhaustiveness checking when we implement some *attached behavior*.

**Functional** language tend to represent such hierarchies as the *algebraic types*. Adding new members to those types might be problematic, but we have better compile-time control for the completeness of the tree traversing code.

## Attached Behavior

The term mentioned above refers to the implementation pattern that decouples the behavior from the data. This seems to be counter-idiomatic in OOP, but even in OOP it has to be implemented every once in a while.
Consider a class hierarchy that describes animals. We would have our abstract base `Animal` and two concrete descendants: `Cat` and `Dog`. Abstraction here means that we do have some *common behavior* that we can implement *differently* in each class. Like an instance method `voice()` that would return `'bark'` for a `Dog` and `'meow'` for a `Cat`.
What if *later* in our development process we face a necessity to say, print the *animal kind*. We could return back to the design phase and add a new virtual method `kind()`, and implement it within each descendant. However, this might be impossible (the type hierarchy is locked and comes out of a third-party source) or impractical (the types are ours, but we don't want to pollute the type definition with all this "behavior" that's not actually inherent to the class instances). This is not the "natural" behavior of the entity we represent by the `Animal` class, this is some "external" behavior we want to *attach* to the type.

The solution offered by OOP for this is the [Visitor Pattern](https://en.wikipedia.org/wiki/Visitor_pattern). It is a reasonably good (even though a bit verbose) way to resolve this *given the class hierarchy is sealed*, i.e. there are no ways to add a new class to this hierarchy. Otherwise the assumptions made when designing the `Visitor` class would not hold and, thus, the handling logic becomes incorrect.

Functional programming doesn't even try coupling the data with behavior. There the type `Animal` would be an algebraic sum of the `Dog` and the `Cat` types. And both `voice` and `kind` would be the *functions* accepting a single parameter of the `Animal` type. The developer implementing those functions would need to explicitly cover every term in the `Animal` type - i.e., to provide the logic for returning `voice` and `kind` for `Cat`s and `Dog`s.
Good news is that the compilers for the most of the statically typed functional languages do support the so-called exhaustiveness checking, statically verifying that all subtypes are covered.

Typescript type system is sophisticated enough to cover both this approaches, so the final choice is left to the user.

## OOP in Typescript

Typescript does support the notion of [classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) with single inheritance. Refer to the documentation for more detail. Whether the target code generation is implemented within an AST node via an overridable method or outside of the nodes via the Visitor pattern is up to the user.

## Algebraic Types in Typescript

Using algebraic types for AST creation is relatively straightforward. Each of the node types can be naturally expressed as an `interface` with the properties specific for the node.

E.g. an extremely simplified arithmetic grammar might have an AST described by the following types:

```ts
type Expr = Const | Negation;
interface Const 
{
    type: 'const',
    value: number
}
interface Negation
{
    type: 'neg',
    argument: Expr;
}
```

Note the discriminator property `type` helping us to tell the instances of `Const` and `Number` apart. It would be quite helpful, allowing us to rely on Typescript's type narrowing.

One of the special cases of this type narrowing is pattern-matching and the exhaustiveness check. Typescript does not include language-level features for the pattern matching, but it's type system is powerful enough to defer it to the 3rd-party libraries.

The [ts-pattern](https://github.com/gvergnaud/ts-pattern) library is quite handy for the cases like AST traversing.
For example, value calculation of an expression described by the `Expr` type described above might look like follows:

```ts
calc(e: Expr): number
{
    return match(e)
    .with({type: 'const'}, c => c.value) // c here is of type Const
    .with({type: 'neg'}, n => - calc(n.argument)) // n here is of type Negation
    .exhaustive(); // this one will cause compile-time error
                   // if the patterns listed above do not 
                   // cover all the possibilities for e
}
```
