import { Signal, signal } from '@preact/signals'
import Route from 'route-event'

/**
 * Setup any state
 *   - routes
 *   - app state
 */
export function State ():{
    route:Signal<string>;
    count:Signal<number>;
    _setRoute:(path:string)=>void;
} {  // eslint-disable-line indent
    const onRoute = Route()

    const state = {
        _setRoute: onRoute.setRoute.bind(onRoute),
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

State.Increase = function Increase (state:ReturnType<typeof State>) {
    state.count.value++
}

State.Decrease = function Decrease (state:ReturnType<typeof State>) {
    state.count.value--
}
