# level todo

Use E2E encryption via browser APIs.

This is an example of writing encrypted state to a database, and synchronizing it amongst several devices.

Note that this *not* a demonstration of CRDTs or any kind of state reconciliation. The `push` and `pull` buttons will simply overwrite the remote or local state.

Serverside, we handle auth via HTTP headers. 
