---
id: best_practices-security
title: Best practices to code secure adapters and extensions
---

# INTRODUCTION
Here is described what each developer needs to take into account when implementing an adapter or extension.
It can also be used as a guide to do a light security review of your code.

It is very easy to forget something or to overlook an issue. Ultimately, we would like to automate as much as possible those checks but in the meantime it seems appropriate to describe what we see are the best practices to write secure code.


# Limit function visibility
You should always prefer internal over public and only make functions visible to the outside world when necessary.
This helps open a function to the outside world when it was not the intent. 

## If the function is public, review carefully what modifier is applied
When a function is public, you should always review carefully what kind of modifier are applied to it. 

The rules are the following:
- If the function is pure or view, you can leave it open
- only an adapter should have a public function that can be called outside of the dao ecosystem
- the function that can be called outside of the ecosystem should always have a reentrancyGuard modifier
- if it is an adapter function ,always review if the function needs a memberOnly or not. 
- if it is not an adapter, it most probably needs an adapterOnly modifier and even check for some access control (hasAccess pattern)


## Avoid multi transactions flow

---
**NOTE**

We are working right now to try to get the proposal flow to work with only one transaction. It is not ready yet because we still need to find
a secure way to prove that the timestamp used in the proposal is correct.

---

in general using multiple transactions makes things much more complicated and error prone. It is very easy to miss an edge care where either assets stay stuck or we end up in an inconsistent state. This is why wherever possible, avoid using multiple transactions to do something. 

We understand that this is not always possible but it should be a necessary evil, not a default solution. 
If you need to create multi-transaction flows, it is important to make it in such a way that it is possible to recover if any step fails. 


## Avoid inheritance as much as possible
Inheritance can make following logic harder to do and you might insert functions in your adapter that you did not intent to do. 
It is usually better to use libraries to share logic among adapters.

The only exception to this is when you want to share modifiers. 