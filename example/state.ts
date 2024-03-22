import { Signal, signal } from '@preact/signals'
import Route from 'route-event'
import { BrowserLevel } from 'browser-level'

/**
 * Setup any state
 *   - routes
 *   - app state
 */
export function State ():{
    route:Signal<string>;
    count:Signal<number>;
    _db:InstanceType<typeof BrowserLevel<string, string|object>>;
    _setRoute:(path:string)=>void;
} {  // eslint-disable-line indent
    const onRoute = Route()

    // Create a database called 'example'
    const db = new BrowserLevel<string, string|object>('example', {
        valueEncoding: 'json'
    })

    const state = {
        _setRoute: onRoute.setRoute.bind(onRoute),
        _db: db,
        count: signal<number>(0),
        route: signal<string>(location.pathname + location.search)
    }

    /**
     * set the app state to match the browser URL
     */
    onRoute((path:string) => {
        // for github pages
        const newPath = path.replace('/template-ts-preact-htm/', '/')
        state.route.value = newPath
    })

    return state
}

State.Put = async function Put (state:ReturnType<typeof State>) {
    const people = state._db.sublevel('people', { valueEncoding: 'utf8' })
    const nameIndex = state._db.sublevel<string, string>('names', {
        valueEncoding: 'utf8'
    })

    await state._db.batch([{
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
}

State.Increase = function Increase (state:ReturnType<typeof State>) {
    state.count.value++
}

State.Decrease = function Decrease (state:ReturnType<typeof State>) {
    state.count.value--
}
