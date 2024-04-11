import { html } from 'htm/preact'
import { useSignal } from '@preact/signals'
import { render } from 'preact'
import {
    Primary as ButtonOutlinePrimary,
    ButtonOutline
} from '@nichoth/components/htm/button-outline'
import { Button } from '@nichoth/components/htm/button'
import { TextInput } from '@nichoth/components/htm/text-input'
import { createDebug } from '@nichoth/debug'
import { State } from './state.js'
import Router from './routes/index.js'
import '@nichoth/components/button-outline.css'
import '@nichoth/components/button.css'
import '@nichoth/components/text-input.css'
import './style.css'

const router = Router()
const state = await State()
const debug = createDebug()

export function Example () {
    debug('rendering example...')
    const match = router.match(state.route.value)

    if (!match) {
        return html`<div class="404">
            <h1>404</h1>
        </div>`
    }

    const ChildNode = match.action(match, state.route)

    function plus (ev) {
        ev.preventDefault()
        State.Increase(state)
    }

    function minus (ev) {
        ev.preventDefault()
        State.Decrease(state)
    }

    function handleSubmit (ev:SubmitEvent) {
        ev.preventDefault()
        const els = (ev.target! as HTMLFormElement).elements
        // @ts-expect-error broken upstream. See https://github.com/microsoft/TypeScript/issues/39003
        const name = els.name.value
        const userId = els['user-id'].value
        debug('got name', name)
        State.Put(state, { name, userId })
    }

    return html`<div class="content">
        <h1>A demonstation of levelDB</h1>

        <h2>Create a new user</h2>

        <form onSubmit=${handleSubmit}>
            <${TextInput}
                name=${'name'}
                displayName=${'new user name'}
                require=${true}
            />
            <${TextInput}
                name=${'user-id'}
                displayName=${'User ID'}
                required=${true}
            />
            <${Button} isSpinning=${false} type=${'submit'}>Submit<//>
        </form>

        <hr />

        <div>
            <h2>DB contents</h2>
            <ul>
                ${state.peopleSignal.value.map(([key, value]) => {
                    debug('person', value)
                    return html`<li>
                        ${value.name}, key: ${key}
                    </li>`
                })}
            </ul>

            <${Button}
                isSpinning=${useSignal(false)}
                onClick=${State.refreshPeople.bind(null, state)}
            >Refresh people list<//>
        </div>

        <div>
            <div>count: ${state.count}</div>

            <ul class="count-controls">
                <li>
                    <${ButtonOutlinePrimary} onClick=${plus}>
                        plus
                    </${ButtonOutline}>
                </li>
                <li>
                    <${ButtonOutline} onClick=${minus}>
                        minus
                    </${ButtonOutline}>
                </li>
            </ul>
        </div>

        <${ChildNode} />
    </div>`
}

render(html`<${Example} />`, document.getElementById('root')!)
