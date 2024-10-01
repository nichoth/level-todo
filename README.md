# level todo

For more words, [see the blog post too](https://nichoth.com/projects/misc-e2ee/)

## E2E encryption

We need a few modules. This uses several [Bicycle Computing](https://github.com/bicycle-codes/) libraries, and the keystore from [Fission](https://github.com/fission-codes).

* [@bicycle-codes/identity](https://github.com/bicycle-codes/identity) -- identity
* [@oddjs/odd](https://github.com/oddsdk/ts-odd) -- save a non-extractable keypair in indexedDB
* [@bicycle-codes/request](https://github.com/bicycle-codes/request) -- verify HTTP requests via headers

I am using a database with [Fauna DB](https://faunadb.com/), and a websocket via [Patykit](https://partykit.io/) also.

## The implementation

See code in [the example folder](./example/).

![Screenshot of the app](image.png)

The app flow is designed like this:

1. You open the app for the first time. The app prompts you to create a new identity. You create an identity. At this point you can save data, and it will be encrypted and backed up on the server.

2. You visit the app from a second device, like your phone. At the bottom of the app are links -- "Link a device to this account" and "Add this device to an existing account".

3. Use the app to add a second device to your account. This uses [the identity module](https://github.com/bicycle-codes/identity) + a websocket via [Partykit](https://partykit.io/) to facilitate multiple devices reading the same data.

## State synchronization

Note that __this is *not* a demonstration of CRDTs__ or any kind of state reconciliation. The `push` and `pull` buttons will simply overwrite the remote or local state.

This can work alright if you are only dealing with updates from a single user. We can assume that a single user would be mindful about which device is most up to date, and would push and pull accordingly.

## authentication

Serverside, we handle auth using HTTP headers, via the [request module](https://github.com/bicycle-codes/request).

## develop

Start a local server with `vite`, a local partykit websocket server, and serve the lambda functions locally. (A complete environment can run locally.)

```sh
npm start
```

You need to add an environment variable for the database. In the root directory, create a file `.env`:

```sh
FAUNA_SECRET="abc123"
```
