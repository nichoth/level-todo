# notes

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

Be sure to use the correct key encoding too

```js
await state._db.sublevel('todos').get(1712998923546, { keyEncoding: charwise })
```
