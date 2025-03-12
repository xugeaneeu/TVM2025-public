# Building AST in Typescript

[[RU](ast.ru.md)|EN]

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
What if *later* in our development process we face a necessity to say, print the *animal kind*. We could return back to the design phase, add a new virtual method `kind()` to the base class, and implement it within each descendant. However, this might be impossible (the type hierarchy is locked and comes out of a third-party source) or impractical (the types are ours, but we don't want to pollute the type definition with all this "behavior" that's not actually inherent to the class instances). This is not the "natural" behavior of the entity we represent by the `Animal` class, this is some "external" behavior we want to *attach* to the type.

The solution offered by OOP for this is the [Visitor Pattern][visitor]:

```ts
abstract class Visitor<T>
{
    visit(a: Animal) : T { return a.visit(this);}
    abstract visitDog(d: Dog): T;
    abstract visitCat(c: Cat): T; 
}

abstract class Animal
{
    abstract voice(): string;
    abstract visit<T>(visitor: Visitor<T>): T
}

class Dog extends Animal
{
    voice = ()=> 'bark';
    visit<T>(visitor: Visitor<T>) { return visitor.visitDog(this);}
}
class Cat extends Animal
{
    voice = ()=> 'meow';
    visit<T>(visitor: Visitor<T>) { return visitor.visitCat(this);}
}

class KindVisitor extends Visitor<string>
{
    visitDog = (d: Dog) => 'dog' ;
    visitCat = (c: Cat) => 'cat';    
}
```

It is a reasonably good (even though a bit verbose) way to resolve this *given the class hierarchy is sealed*, i.e. there are no ways to add a new class to this hierarchy. Otherwise the assumptions made when designing the `Visitor` class would not hold and, thus, the handling logic becomes incorrect.

Functional programming doesn't even try coupling the data with behavior. There the type `Animal` would be an algebraic sum of the `Dog` and the `Cat` types. And both `voice` and `kind` would be the *functions* accepting a single parameter of the `Animal` type. The developer implementing those functions would need to explicitly cover every term in the `Animal` type - i.e., to provide the logic for returning `voice` and `kind` for `Cat`s and `Dog`s.

Good news is that the compilers for the most of the statically typed functional languages do support the so-called exhaustiveness checking, statically verifying that all subtypes are covered:

```ts

interface Dog{
    type: 'Dog';
};
interface Cat{
    type: 'Cat';
};

type Animal = Dog | Cat;

function voice(a: Animal): string
{
    switch(a.type)
    {
        case 'Dog': return 'bark';
        case 'Cat': return 'meow';
    }
}

function kind(a: Animal): string // ts 2366: `Function lacks ending return statement and return type does not include 'undefined'`
{
    switch(a.type)
    {
        case 'Dog': return 'dog';
        //case 'Cat': return 'cat'; // uncomment this line to avoid compile-time error
    }
}

```

Typescript type system is sophisticated enough to cover both this approaches, so the final choice is left to the user.

## OOP in Typescript

Typescript does support the notion of [classes] with single inheritance. Refer to the documentation for more detail. Whether the target code generation is implemented within an AST node via an overridable method or outside of the nodes via the Visitor pattern is up to the student.

## Algebraic Types in Typescript

Using algebraic types for AST creation is relatively straightforward. Each of the node kinds can be naturally expressed as an `interface` with the attributes specific for the kind.

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

Note the discriminator attribute `type` helping us to tell the instances of `Const` and `Number` apart. It is quite helpful, allowing us to rely on Typescript's type narrowing.

Some of the special cases of this type narrowing are the [pattern-matching] and the exhaustiveness check.
For example, value calculation of an expression described by the `Expr` type defined above might look like follows:

```ts
calc(e: Expr): number
{
    switch(e.type)
    {
        case 'const': return e.value; // e here is of type Const
        case 'neg': return - calc(e.argument) // e here is of type Neg
    }
}
```

[visitor]: https://en.wikipedia.org/wiki/Visitor_pattern
[classes]: https://www.typescriptlang.org/docs/handbook/2/classes.html
[pattern-matching]: https://en.wikipedia.org/wiki/Pattern_matching
