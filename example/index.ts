import { render } from 'preact'
import { html } from 'htm/preact'
import { Toaster } from '@nichoth/components/htm/toast'
import Debug from '@nichoth/debug'
import { State } from './state.js'
import Router from './routes/index.js'
import '@nichoth/components/toast.css'
import '@nichoth/components/close-btn.css'
import '@nichoth/components/button-outline.css'
import '@nichoth/components/button.css'
import '@nichoth/components/text-input.css'
import './style.css'

const state = await State()
const debug = Debug()
const router = Router()

export function LevelExample () {
    debug('rendering example...', state)

    const match = router.match(state.route.value)

    const ChildNode = match ?
        match.action(match, state.route) :
        function () {
            return html`<h1>404</h1>`
        }

    function closeToast (ev:MouseEvent) {
        ev.preventDefault()
        state.linkStatus.value = null
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

        <hr />

        <div class="meta-controls">
            <a href="/link-device">Link a new device to this account</a>
            <a href="/connect">Add this device to an existing account</a>
        </div>

        ${state.linkStatus.value ?
            html`<${Toaster} type="success" onClose=${closeToast}>
                Success adding device
            <//>` :
            null
        }
    </div>`
}

render(html`<${LevelExample} />`, document.getElementById('root')!)
