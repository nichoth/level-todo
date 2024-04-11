import { Signal, signal } from '@preact/signals'
import Route from 'route-event'
import { BrowserLevel } from 'browser-level'
// import { AbstractSublevel } from 'abstract-level'
import charwise from 'charwise-compact'
import Debug from '@nichoth/debug'
const debug = Debug()

export async function State ():Promise<{
    route:Signal<string>;
    count:Signal<number>;
    peopleSignal:Signal<[string, { name }][]>;
    _people;
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

    const people = db.sublevel<charwise, 'json'>('people', {
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
        _people: people,
        _nameIndex: nameIndex,
        count: signal<number>(await db.get('count') as number),
        peopleSignal: signal<[string, { name:string }][]>([]),
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
        window.people = people

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

    State.refreshPeople(state)

    return state
}

State.GetDB = function (
    state:Awaited<ReturnType<typeof State>>
):InstanceType<typeof BrowserLevel<number|string, number|object>> {
    return state._db
}

/**
 * Add a new user to the database.
 * @param state State instance
 * @param name The new user's name
 */
State.Put = async function Put (
    state:Awaited<ReturnType<typeof State>>,
    { name, userId }:{ name:string, userId:string }
) {
    const people = state._people
    const nameIndex = state._nameIndex

    debug('putting the new thing', name, userId)

    await state._db.batch([{
        type: 'put',
        sublevel: people,
        key: parseInt(userId),
        value: { name }
    }, {
        type: 'put',
        sublevel: nameIndex,
        key: name,
        value: parseInt(userId)
    }])
}

State.refreshPeople = async function (
    state:Awaited<ReturnType<typeof State>>
):Promise<void> {
    const list = await state._people.iterator({
        valueEncoding: 'json',
        keyEncoding: charwise
    }).all()
    state.peopleSignal.value = list
}

State.GetByName = async function GetByName (
    state:Awaited<ReturnType<typeof State>>,
    name:string
) {
    const id = await state._nameIndex.get(name)
    const record = await state._people.get(id)
    debug('got person record', record)
    return record
}

State.Increase = function Increase (
    state:Awaited<ReturnType<typeof State>>
) {
    state._db.put('count', state.count.value + 1)
    state.count.value++
}

State.Decrease = function Decrease (
    state:Awaited<ReturnType<typeof State>>
) {
    state._db.put('count', state.count.value - 1)
    state.count.value--
}

if (import.meta.env.DEV) {
    // @ts-expect-error DEV env
    window.State = State
}
