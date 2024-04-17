import { Signal, signal } from '@preact/signals'
import stringify from 'json-canon'
import {
    create as createID,
    Identity,
    EncryptedMessage
} from '@bicycle-codes/identity'
import { program as createProgram } from '@oddjs/odd'
import Route from 'route-event'
import { BrowserLevel } from 'browser-level'
import charwise from 'charwise-compact'
import { toString } from 'uint8arrays/to-string'
import ts from 'monotonic-timestamp'
import { SignedRequest } from '@bicycle-codes/request'
import { blake3 } from '@noble/hashes/blake3'
import ky from 'ky'
import type { DID } from '@bicycle-codes/identity'
import Debug from '@nichoth/debug'
import { Implementation } from '@oddjs/odd/lib/components/crypto/implementation'
const debug = Debug()

const PUSH_URL = '/api/push'

export type Todo = {
    completed:boolean;
    name:string;
}

export interface Metadata {
    proof:string;  // hash of the (unencrypted) content
    localSeq:number;  // the seq number for *this device* only
    username:string;
    author:DID;  // DID for this device
}

export interface DomainMessage {
    metadata:Metadata;
    content:EncryptedMessage
}

// export type EncryptedMessage = {
//     metadata:Metadata;
//     content:string|null;  // stringified & encrypted JSON object
// }

// export type UnencryptedMessage = {
//     metadata:Metadata|Metadata;
//     content:object|null;  // `content` gets JSON stringified
// }

/**
 * The issue is the encodings are different for each sublevel
 *
 * You *can* get all values, including subs, if the encoding is the same
 */

/**
 * Create app state. We use a timestamp as keys for todo items in levelDB.
 *
 * @returns Application state
 */
export async function State ():Promise<{
    route:Signal<string>;
    todosSignal:Signal<[number, EncryptedMessage][]>;
    me:Identity;
    _todos;
    _nameIndex;
    _db:InstanceType<typeof BrowserLevel<charwise, EncryptedMessage>>;
    _request:ReturnType<typeof SignedRequest>
    _setRoute:(path:string)=>void;
    _crypto:Implementation
}> {  // eslint-disable-line indent
    const onRoute = Route()

    const program = await createProgram({
        namespace: {
            name: 'level-todo',
            creator: 'bicycle-computing'
        }
    })

    const crypto = program.components.crypto

    const request = SignedRequest(ky, crypto, window.localStorage)

    const me = await createID(crypto, {
        humanName: 'tester'
    })

    debug('your ID', me)

    // Create a database called 'example123'
    const db = new BrowserLevel<charwise, EncryptedMessage>('example123', {
        keyEncoding: charwise,
        valueEncoding: 'json'
    })

    // gets us object values
    // await db.sublevel('people').get('123', { valueEncoding: 'json' })

    // gets us string values
    // await db.sublevel('people').get('123')

    const todos = db.sublevel('todos', {
        valueEncoding: 'json',
        keyEncoding: charwise
    })

    const nameIndex = db.sublevel('names', {
        valueEncoding: 'json',
        keyEncoding: charwise
    })

    /**
     * Example of iterator that gets correct (object) values
     * ```js
     * await db.sublevel('todos').iterator({ valueEncoding: 'json' }).all()
     * ```
     */

    const state = {
        _setRoute: onRoute.setRoute.bind(onRoute),
        _db: db,
        _todos: todos,
        _nameIndex: nameIndex,
        _request: request,
        _crypto: crypto,
        me,
        todosSignal: signal<[number, EncryptedMessage][]>([]),
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
        const newPath = path.replace('/level-todo/', '/')
        state.route.value = newPath
    })

    State.refreshState(state)
    return state
}

State.GetDB = function (
    state:Awaited<ReturnType<typeof State>>
):InstanceType<typeof BrowserLevel<charwise, EncryptedMessage>> {
    return state._db
}

/**
 * Add a new todo item to the database.
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

    const last = state.todosSignal.value[state.todosSignal.value.length]
    let localSeq:number
    if (last) {
        localSeq = last[1].metadata.localSeq + 1
    } else {
        localSeq = 1
    }

    const pendingTodo = { name, completed: false }

    const newMetadata:Metadata = {
        // hash of the (unencrypted) content
        proof: toString(blake3(stringify(pendingTodo)), 'base64urlpad'),
        localSeq,  // the seq number for *this device* only
        username: state.me.username,
        author: state.me.rootDID
    }

    // encrypt our todo item

    await state._db.put(newId, {
        metadata: newMetadata,
        content: ''
    })

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
        // valueEncoding: 'json',
        keyEncoding: charwise
    }).all()

    debug('list of todos', list)
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
    // @ts-expect-error DEV env
    window.BrowserLevel = BrowserLevel
}

/**
 * Push our local state to the server
 */
State.Push = async function (state:Awaited<ReturnType<typeof State>>) {
    // local state is the source of truth
    // this would create merge conflicts if
    // we were doing this with offline capability &
    // multiple devices

    const list = await state._todos.iterator().all()

    ky.post(PUSH_URL, {
        json: list
    })
}
