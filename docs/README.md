# level adventure

Trying levelDB

## secondary indexes

LevelDB is great. It gives you a fast, persistent key/value store, plus range queries. *But*... what about secondary indexes? In levelDB, you always have a `key` property on any record. This is the basis for range queries -- sorted keys. Lets say you want to keep a record for users, and the primary key is an ID. But you also want to be able to get them by their name.

[See levelDB README -- the secondary index example](https://github.com/Level/abstract-level?tab=readme-ov-file#dbbatchoperations-options)

Use [level.sublevel](https://github.com/Level/abstract-level?tab=readme-ov-file#sublevel) + `level.batch`.

```js
const people = db.sublevel('people', { valueEncoding: 'json' })
const nameIndex = db.sublevel('names')

await db.batch([{
  type: 'put',
  sublevel: people,
  key: '123',
  value: {
    name: 'Alice'
  }
}, {
  type: 'put',
  sublevel: nameIndex,
  key: 'Alice',
  value: '123'
}])
```

Perform multiple put operations in a single transaction, that is, atomically.

In the example we create a second record, that as its value just has the key of the first record. Looking up a user by name is then like this:

```js
const key = await db.get('Alice')
const user = await db.get(key)
```

-----------------------------------------------------

## Wed. 4-10-2024

Fix the key sorting by calling `parseInt` on the input values.
