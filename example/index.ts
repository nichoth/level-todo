import { html } from 'htm/preact'
import { render } from 'preact'
import {
    Primary as ButtonOutlinePrimary,
    ButtonOutline
} from '@nichoth/components/htm/button-outline'
import { createDebug } from '@nichoth/debug'
import { State } from './state.js'
import Router from './routes/index.js'
import '@nichoth/components/button-outline.css'
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
        <h1>hello</h1>

        <header>
            <nav>
                <ul class="nav">
                    <li class="${getClass('/aaa')}"><a href="/aaa">aaa</a></li>
                    <li class="${getClass('/bbb')}"><a href="/bbb">bbb</a></li>
                    <li class="${getClass('/ccc')}"><a href="/ccc">ccc</a></li>
                </ul>
            </nav>
        </header>

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

function getClass (href) {
    return isActive(href) ? 'active' : ''
}

function isActive (href) {
    return location.pathname === href
}

render(html`<${Example} />`, document.getElementById('root')!)
