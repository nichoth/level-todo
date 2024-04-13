import { Signal, signal } from '@preact/signals'
import Route from 'route-event'
import { BrowserLevel } from 'browser-level'
import charwise from 'charwise-compact'
import ts from 'monotonic-timestamp'
import Debug from '@nichoth/debug'
const debug = Debug()

export type Todo = {
    completed:boolean
    name:string
}

export async function State ():Promise<{
    route:Signal<string>;
    todosSignal:Signal<[number, { name:string, completed:boolean }][]>;
    _todos;
    _nameIndex;
    _db:InstanceType<typeof BrowserLevel<number|string, number|Todo>>;
    _setRoute:(path:string)=>void;
}> {  // eslint-disable-line indent
    const onRoute = Route()

    // Create a database called 'example'
    const db = new BrowserLevel<number|string, number|Todo>('example123', {
        valueEncoding: 'json',
        keyEncoding: charwise
    })

    // gets us object values
    // await db.sublevel('people').get('123', { valueEncoding: 'json' })

    // gets us string values
    // await db.sublevel('people').get('123')

    const todos = db.sublevel<charwise, 'json'>('todos', {
        valueEncoding: 'json',
        keyEncoding: charwise
    })
    const nameIndex = db.sublevel<charwise, 'utf8'>('names', {
        // valueEncoding: charwise,
        keyEncoding: charwise
    })

    /**
     * Example of iterator that gets correct (object) values
     * ```js
     * await db.sublevel('people').iterator({ valueEncoding: 'json' }).all()
     * ```
     */

    const state = {
        _setRoute: onRoute.setRoute.bind(onRoute),
        _db: db,
        _todos: todos,
        _nameIndex: nameIndex,
        todosSignal: signal<[number, Todo][]>([]),
        route: signal<string>(location.pathname + location.search)
    }

    if (import.meta.env.DEV) {
        // @ts-expect-error DEV mode
        window.state = state
        // @ts-expect-error DEV
        window.charwise = charwise
        // @ts-expect-error DEV mode
        window.db = db
        // @ts-expect-error DEV mode
        window.nameIndex = nameIndex
        // @ts-expect-error DEV mode
        window.todos = todos

        // @ts-expect-error DEV
        window.BrowserLevel = BrowserLevel
    }

    /**
     * set the app state to match the browser URL
     */
    onRoute((path:string) => {
        // for github pages
        const newPath = path.replace('/level-adventure/', '/')
        state.route.value = newPath
    })

    State.refreshState(state)

    return state
}

State.GetDB = function (
    state:Awaited<ReturnType<typeof State>>
):InstanceType<typeof BrowserLevel<number|string, number|Todo>> {
    return state._db
}

/**
 * Add a new user to the database, and create a secondary index of name.
 *
 * @param state State instance
 * @param name The new user's name
 */
State.Create = async function Create (
    state:Awaited<ReturnType<typeof State>>,
    { name }:{ name:string }
) {
    const todos = state._todos
    const nameIndex = state._nameIndex
    const newId = ts()

    debug('putting the new thing', name, newId)

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

    await State.refreshState(state)
}

State.refreshState = async function (
    state:Awaited<ReturnType<typeof State>>
):Promise<void> {
    const list = await state._todos.iterator({
        valueEncoding: 'json',
        keyEncoding: charwise
    }).all()
    state.todosSignal.value = list
}

State.GetByName = async function GetByName (
    state:Awaited<ReturnType<typeof State>>,
    name:string
) {
    const id = await state._nameIndex.get(name)
    debug('got id', id)
    const record = await state._todos.get(parseInt(id))
    debug('got todo record', record)
    return record
}

State.Complete = async function Complete (
    state:Awaited<ReturnType<typeof State>>,
    id:string
) {
    // first update DB
    debug('marking as complete', id)
    const doc = await state._todos.get(parseInt(id));
    (doc as Todo).completed = true
    await state._todos.put(parseInt(id), doc)
    await State.refreshState(state)

    // then update state
    // const list = state.todosSignal.value
    // list[list.indexOf(todo!)] = [parseInt(id), { ...todo, completed: false }]
    // const todo = state.todosSignal.value.find(([key]) => {
    //     return key === parseInt(id)
    // })
}

State.Uncomplete = async function Uncomplete (
    state:Awaited<ReturnType<typeof State>>,
    _id:string
) {
    const id = parseInt(_id)
    const oldDoc = state.todosSignal.value.find(([key]) => {
        return key === id
    })
    if (!oldDoc) throw new Error('not old doc')

    await state._todos.put(id, { ...oldDoc[1], completed: false })
    await State.refreshState(state)
}

if (import.meta.env.DEV) {
    // @ts-expect-error DEV env
    window.State = State
}
