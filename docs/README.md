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

### copying the TODO example from [lofi-test-instantdb](https://github.com/nichoth/lofi-test-instantdb/blob/main/src/routes/home.ts)

```js
import { html } from 'htm/preact'
import Debug from '@nichoth/debug'
import { FunctionComponent } from 'preact'
import { Accordion } from '@nichoth/components/htm/accordion'
import { State, AppState } from '../state'
import '@nichoth/components/accordion.css'
import { doTransaction, clearData } from '../mock-data'

const debug = Debug()

export const HomeRoute: FunctionComponent<{
  state: AppState
}> = function ({ state }) {
    debug('state in home', state)

    return html`<div class="route home">
        <h2>home route</h2>

        ${state.goalsWithTodos.value.isLoading ?
            html`<div>Loading...</div>` :
            html`
                <h2>Goals</h2>
                <button onClick=${() => doTransaction()}>
                    Load Data
                </button>
                <button
                    onClick=${() => clearData(state.goalsWithTodos)}
                >
                    Delete Data
                </button>
                <${Goals} state=${state} goals=${state.goalsWithTodos} />
            `
        }
    </div>`
}

/**
 * Update something
 * transact([
 *   tx.goals[myId].update({ title: 'eat' })
 * ])
 */

/**
 * Use the `update` action to create entities also.
 *
 * ```js
 * transact([tx.goals[id()].update({ title: 'eat' })])
 * ```
 *
 * This creates a new `goal`
 */

function Goals ({ goals, state }:{
    goals:AppState['goalsWithTodos'];
    state:ReturnType<typeof State>;
}) {
    function check (ev) {
        const el = ev.target
        const isComplete = el.checked
        const { todoId } = el.dataset
        if (isComplete) {
            return State.Complete(todoId)
        }

        // is not complete
        State.Uncomplete(todoId)
    }

    return html`<ul class="goals">
        ${goals.value.data!.goals.map(goal => {
            return html`<li data-goalId="${goal.id}" class="goal">
                <${Accordion}>
                    <summary>${goal.title}</summary>
                    <ul>${goal.todos.map(todo => {
                        return html`<li id="${todo.id}">
                            <input class="toggle" type="checkbox"
                                checked=${todo.isComplete}
                                name="completed"
                                id=${todo.id}
                                onChange=${check}
                                data-todo-id=${todo.id}
                            />
                            ${' ' + todo.title}
                        </li>`
                    })}</ul>
                <//>
            </li>`
        })}
    </ul>`
}
```

See [triplit todo demo too](https://github.com/nichoth/triplit-test/blob/main/src/routes/home.ts)
