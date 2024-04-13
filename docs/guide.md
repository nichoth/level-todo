# guide

Lets make a todo list app. People seem to like those.

We want to be able to save a list and then see it again later, but we don't
really need this todo list to be visible to the entire world, so there is no
need to make a *website*. We can just use our device's local storage.

[See this commit hash](hash-here)

That was easy. Now we have a persistent list.

## indexedDB

Use `{ valueEncoding }` to set the type that is returned.

Get values as objects
```js
await db.sublevel('sublevel-name').get('123', { valueEncoding: 'json' })
```

Get values as strings
```js
await db.sublevel('sublevel-name').get('123')
```
