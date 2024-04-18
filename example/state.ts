import { Signal, signal, batch } from '@preact/signals'
import { numbers } from '@nichoth/nanoid-dictionary'
import { PartySocket } from 'partysocket'
import { customAlphabet } from '@nichoth/nanoid'
import stringify from 'json-canon'
// import type { AbstractSublevel } from 'abstract-level'
import {
    create as createID,
    Identity,
    encryptTo,
    decryptMsg,
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
const PULL_URL = '/api/pull'

/**
 * This is storing things in plain text in our local indexedDB.
 * They are encrypted before sending to the server.
 */

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
    content:Todo;
}

// export type EncryptedMessage = {
//     metadata:Metadata;
//     content:string|null;  // stringified & encrypted JSON object
// }

// export type UnencryptedMessage = {
//     metadata:Metadata|Metadata;
//     content:object|null;  // `content` gets JSON stringified
// }

type AppDeviceRecord = {
    humanReadableDeviceName:string;  // a human-readable name
    deviceName:string  // the random unique name
}

/**
 * Create app state. We use a timestamp as key for todo items in levelDB.
 *
 * @returns Application state
 */
export async function State ():Promise<{
    route:Signal<string>;
    todosSignal:Signal<[number, DomainMessage][]>;
    me:Signal<Identity|null>;
    pendingChange:boolean;
    code:Signal<string|null>;
    linkStatus:Signal<'success'|null>;
    devices:Signal<Record<string, AppDeviceRecord>|null>;
    _todos;
    _partysocket:InstanceType<typeof PartySocket>|null;
    _nameIndex;
    _db:InstanceType<typeof BrowserLevel<charwise, DomainMessage>>;
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

    const storedUsername = localStorage.getItem('username')

    let me:Awaited<ReturnType<typeof createID>>|null
    if (storedUsername) {
        me = await createID(crypto, {
            humanName: storedUsername
        })
    } else {
        me = null
    }

    debug('your ID', me!)

    // Create a database called 'example123'
    const db = new BrowserLevel<charwise, DomainMessage>('example123', {
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
        _partysocket: null,
        devices: signal(null),
        linkStatus: signal(null),
        code: signal(null),
        pendingChange: false,
        me: signal<Identity|null>(me),
        todosSignal: signal<[number, DomainMessage][]>([]),
        route: signal<string>(location.pathname + location.search)
    }

    if (import.meta.env.DEV || import.meta.env.MODE === 'staging') {
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
):InstanceType<typeof BrowserLevel<charwise, DomainMessage>> {
    return state._db
}

State.CreateUser = async function (
    state:Awaited<ReturnType<typeof State>>,
    { name }:{ name:string }
) {
    localStorage.setItem('username', name)

    state.me.value = await createID(state._crypto, {
        humanName: name
    })
}

/**
 * Add a new todo item to the database.
 *
 * @param state State instance
 * @param name The new todo's name
 */
State.Create = async function Create (
    state:Awaited<ReturnType<typeof State>>,
    { name }:{ name:string }
) {
    const todos = state._todos
    const nameIndex = state._nameIndex
    const newId = ts()

    debug('putting the new thing', newId, name)

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
        username: state.me.value!.username,
        author: state.me.value!.rootDID
    }

    debug('new metadata', newMetadata)

    await state._db.batch([{
        type: 'put',
        sublevel: todos,
        key: newId,
        value: { metadata: newMetadata, content: pendingTodo }
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
    const doc:DomainMessage = (await state._todos.get(parseInt(id)))
    const { metadata, content } = doc
    content.completed = true
    await state._todos.put(parseInt(id), { metadata, content })
    await State.refreshState(state)
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

    await state._todos.put(id, {
        ...oldDoc[1],
        content: Object.assign(oldDoc[1].content, {
            completed: false
        })
    })
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

    debug('pushing a list', list)

    const encryptedList = await encryptTo(state.me.value!, null, stringify(list))

    debug('encrypted list', encryptedList)

    await state._request.post(PUSH_URL, {
        json: encryptedList,
    })
}

/**
 * Fetch state from the server
 * This will overwrite any local state
 */
State.Pull = async function Pull (state:Awaited<ReturnType<typeof State>>) {
    // get the data from server
    const encryptedList = await state._request.get(PULL_URL).json()

    debug('encrypted list', encryptedList)

    // decrypt the state
    const list:[number, DomainMessage][] = JSON.parse(await decryptMsg(
        state._crypto,
        encryptedList
    ))

    debug('pulled a list', list)

    // set state
    state._todos.value = list
}

/**
 * Add a new device to this account.
 *
 * This should be called from the route `link-device`
 * (from the existing device).
 */
State.AddDevice = function (
    state:Awaited<ReturnType<typeof State>>,
    newId:Identity,
    newDevice:AppDeviceRecord
) {
    state.me.value = newId
    state.devices.value = Object.assign({}, state.devices.value, {
        [newDevice.deviceName]: newDevice
    })

    /**
     * @TODO
     * Use full (lowercase) alphabet, for less chance of collision?
     */
    const PIN = customAlphabet(numbers, 6)
    state.code.value = ('' + PIN())
}

/**
 * Call this from a new device, after linking it to an existing device
 */
State.LinkSuccess = function LinkSuccess (
    state:Awaited<ReturnType<typeof State>>,
    newIdRecord:Identity,
    newDevice:AppDeviceRecord
) {
    batch(() => {
        state.me.value = newIdRecord
        state.devices.value = Object.assign({}, state.devices.value, {
            [newDevice.deviceName]: newDevice
        })
        state.linkStatus.value = 'success'
    })

    state._setRoute('/')
}
