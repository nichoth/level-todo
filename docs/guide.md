# guide

Lets make a todo list app. People seem to like those.

We want to be able to save a list and then see it again later; it should be
*persistent*. We don't really need this list to be visible to the entire
world, so there is no need to make a *website*. We can just use our device's
local storage.

[See tag `local`](https://github.com/nichoth/level-todo/releases/tag/local)

That was easy. Now now we have a persistent list. We are using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) with the [levelDB](https://github.com/Level/browser-level) API.

Since we are the only person who cares about what's on it, there is no need to save this to a server. It can just stay in our own web browser. But -- we have multiple devices. Working on multiple devices is now "table stakes" for any app. We have a computer and phone at minimum. We want the same data to be visible on both.

...That means we are not local anymore? If we use data on more than one device, then it needs a way to travel from one device to the other.

And what about backup? We want this data to continue existing even in the event that we lose our device(s). Hmm... it's not so simple anymore. We need multi-device sync, and backup copies.

That brings privacy into the picture. We don't want anyone else to be able to our todo list, because no one else needs to read it.

There are varying shades of privacy. This could be private because we sign in to a server, and the server only serves us the data. But that means that the server could still read the list.

Why would that matter? At the most innocuous, this server would read our lists, and use that info to sell advertisements to us. Maybe that's not so bad. In the less innocuous scenario, this server operator might read a todo item about our reproductive rights, or soomething political, for example, and now we are in a morass of legal issues.

Somehow our simple todo list has turned into an investigation of personal privacy on the internet. That's what we'll look at. How do we get synchronization between multiple devices while still keeping things private? We want ✨ *E2E encryption* ✨.


-----------------------------------------------------------------------


## level DB notes

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
