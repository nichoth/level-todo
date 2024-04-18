import { html } from 'htm/preact'
import { render } from 'preact'
import { createDebug } from '@nichoth/debug'
import { State } from './state.js'
import Router from './routes/index.js'
import '@nichoth/components/button-outline.css'
import '@nichoth/components/button.css'
import '@nichoth/components/text-input.css'
import './style.css'

const state = await State()
const debug = createDebug()
const router = Router()

export function LevelExample () {
    debug('rendering example...')

    const match = router.match(state.route.value)

    const ChildNode = match ?
        match.action(match, state.route) :
        function () {
            return html`<h1>404</h1>`
        }

    return html`<header>
        <nav>
            <ul class="nav">
                <li><a href="/">home</a></li>
                <li><a href="/devices">devices</a></li>
            </ul>
        </nav>
    </header>

    <div class="content">
        <h1>Encryption, E2E</h1>

        ${state.me.value ?
            html`
                <div>You are: <strong>${state.me.value.humanName}</strong></div>
                <hr />
            ` :
            null
        }

        <${ChildNode} state=${state} />
    </div>`
}

render(html`<${LevelExample} />`, document.getElementById('root')!)
