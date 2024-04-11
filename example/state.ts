import { Signal, signal } from '@preact/signals'
import Route from 'route-event'
import { BrowserLevel } from 'browser-level'
import charwise from 'charwise-compact'
import ts from 'monotonic-timestamp'
import Debug from '@nichoth/debug'
const debug = Debug()

export async function State ():Promise<{
    route:Signal<string>;
    todosSignal:Signal<[string, { name }][]>;
    _todos;
    _nameIndex;
    _db:InstanceType<typeof BrowserLevel<number|string, number|object>>;
    _setRoute:(path:string)=>void;
}> {  // eslint-disable-line indent
    const onRoute = Route()

    // Create a database called 'example'
    const db = new BrowserLevel<number|string, number|object>('example123', {
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
        valueEncoding: 'utf8',
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
        count: signal<number>(await db.get('count') as number),
        todosSignal: signal<[string, { name:string }][]>([]),
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
):InstanceType<typeof BrowserLevel<number|string, number|object>> {
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
    const record = await state._todos.get(id)
    debug('got person record', record)
    return record
}

if (import.meta.env.DEV) {
    // @ts-expect-error DEV env
    window.State = State
}
