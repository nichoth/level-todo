import { html } from 'htm/preact'
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
const state = State()
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

    return html`<div class="content">
        <h1>A demonstation of levelDB</h1>

        <h2>Create a new user</h2>

        <p>

        </p>

        <form>
            <${TextInput} displayName=${'new user name'} />
            <${Button} isSpinning=${false} type=${'submit'}>Submit<//>
        </form>

        <hr />

        <div>
            <div>count: ${state.count.value}</div>

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
