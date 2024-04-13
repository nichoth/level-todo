# guide

Lets make a todo list app. People seem to like those.

We want to be able to save a list and then see it again later; it should be
*persistent*. We don't really need this todo list to be visible to the entire
world, so there is no need to make a *website*. We can just use our device's
local storage.

[See tag `local`](https://github.com/nichoth/level-todo/releases/tag/local)

That was easy. Now now we have a persistent list. We are using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) with the [levelDB](https://github.com/Level/browser-level) API.

## level DB

### secondary index

Note we are using a secondary index on the `name` field of each todo item.

```js
const nameIndex = db.sublevel<charwise, 'utf8'>('names', {
    keyEncoding: charwise
})
```

Creating a new todo item then is a two-step operation, both adding the todo object, and adding an index entry. See [level DB docs](https://github.com/Level/abstract-level?tab=readme-ov-file#dbbatchoperations-options).

```js
await state._db.batch([{
    type: 'put',
    sublevel: todos,
    key: newId,
    value: { name, completed: false }
}, {
    type: 'put',
    sublevel: nameIndex,
    key: name,
    value: newId
}])
```

### Example of a lookup by name
Using our secondary index is a two step operation also. First get the ID via the name index, then use the ID to get the todo document.

```js
State.GetByName = async function GetByName (
    state:Awaited<ReturnType<typeof State>>,
    name:string
) {
    const id = await state._nameIndex.get(name)
    const record = await state._todos.get(parseInt(id))
    return record
}
```
