ember-template-modifier-import
==============================================================================

forked from https://github.com/crashco/ember-template-component-import and changed to allow modifier imports
This is to be used alongside https://github.com/crashco/ember-template-component-import

This addon allows you to use import-style syntax to create local bindings to
a modifier within a template file.

* More concise modifier invocation while making it explicit where it comes from
* No hyphens needed!
* Relative imports!

Installation
------------------------------------------------------------------------------

```
ember install ember-template-modifier-import
```


Usage
------------------------------------------------------------------------------

Use the same kind of import syntax you are familiar with from Javascript:

```hbs
{{import mymodifier from 'ui/modifier'}}

{{mymodifier 'a'}}

{{import modifier as asmodifier from "ui/modifiers" }}
{{import a as amodifier from "ui/modifiers" }}
{{import "* as modifiers" from "u/modifiersi" }}
{{import "a, b" from "ui/modifiers" }}
{{import "a as x, b as y" from "ui/modifiers" }}
{{import "a as z, modifier" from "ui/modifiers" }}
```

The modifier is looked up from the given string using a direct lookup
pattern.

Motivation
------------------------------------------------------------------------------

[ember-template-component-import](https://github.com/crashco/ember-template-component-import)
already gives us import for components, but I really miss the modifier imports.
So I went ahead and added this functionality :)


But what about Module Unification?
------------------------------------------------------------------------------

Once Module Unification lands fully, this addon will be largely obsolete. MU
provides all these benefits and more.

So on the one hand, your templates will start to look _something kinda like_
MU a little sooner, which is nice.

But be warned - any official tooling to codemod templates into a new MU world
likely won't support this addon. So weigh the pros and cons carefully before
widely adopting this addon.

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
