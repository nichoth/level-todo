import { html } from 'htm/preact'
import { FunctionComponent } from 'preact'
import { State } from '../state.js'

export const Devices:FunctionComponent<{
    state:Awaited<ReturnType<typeof State>>
}> = function DevicesRoute ({ state }) {
    return html`<div class="route devices">
        <h2>A list of your devices</h2>

        ${state.me.value ?
            html`<ul>
                ${Object.keys(state.me.value?.devices || {}).map((k) => {
                    const device = state.me.value?.devices[k]
                    return html`<li>${device?.humanReadableName}</li>`
                })}
            </ul>` :
            html`<p><em>none</em></p>`
        }
    </div>`
}
