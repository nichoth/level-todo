import { html } from 'htm/preact'
import { FunctionComponent } from 'preact'
import { TextInput } from '@nichoth/components/htm/text-input'
import { Button } from '@nichoth/components/htm/button'
import { ButtonOutline } from '@nichoth/components/htm/button-outline'
import { State } from '../state.js'

export const HomeRoute:FunctionComponent<{
    state:Awaited<ReturnType<typeof State>>
}> = function HomeRoute ({ state }) {
    function check (ev) {
        const el = ev.target
        const isComplete = el.checked
        const { id }:{ id:string } = el.dataset
        if (isComplete) {
            return State.Complete(state, id)
        }

        // not complete
        State.Uncomplete(state, id)
    }

    async function handleSubmit (ev:SubmitEvent) {
        ev.preventDefault()
        const els = (ev.target! as HTMLFormElement).elements
        // @ts-expect-error broken upstream. See https://github.com/microsoft/TypeScript/issues/39003
        const name = els.name.value
        await State.Create(state, { name })
        // @ts-expect-error broken upstream. See https://github.com/microsoft/TypeScript/issues/39003
        els.name.value = ''
    }

    return html`<div class="route home">
        <h2>The List</h2>

        ${Object.keys(state.todosSignal.value).length ?
            html`<ul class="todo-list">
                ${state.todosSignal.value.map(([key, todo]) => {
                    const classes = todo.content.completed ?
                        'todo completed' :
                        'todo'

                    return html`<li key=${key} class=${classes}>
                        <input class="toggle"
                            checked=${todo.content.completed}
                            type="checkbox"
                            name="done-status"
                            id="${key}"
                            data-id=${key}
                            onChange=${check}
                        />

                        <label>
                            ${todo.content.name}
                        </label>
                    </li>`
                })}
            </ul>` :
            html`<em class="empty-list">none</em>`
        }

        <hr />

        <form onSubmit=${handleSubmit}>
            <h2>Create something to do</h2>

            <${TextInput}
                name=${'name'}
                displayName=${'something to do'}
                required=${true}
            />
            <${Button} isSpinning=${false} type=${'submit'}>Submit<//>
        </form>

        <p>
            The buttons <code>push</code> and <code>pull</code> will just
            overwrite the local or remote state. We are not doing anything
            clever with Merkle lists or state reconciliation.
        </p>

        <div class="push-pull-controls">
            <${ButtonOutline} onClick=${() => State.Push(state)}>push<//>
            <${ButtonOutline} onClick=${() => State.Pull(state)}>pull<//>
        </div>

        <hr />

        <div class="meta-controls">
            <a href="/link-device">Link a new device to this account</a>
            <a href="/connect">Add this device to an existing account</a>
        </div>
    </div>`
}
