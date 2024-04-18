import { html } from 'htm/preact'
import { render } from 'preact'
import { Button } from '@nichoth/components/htm/button'
import {
    ButtonOutline,
} from '@nichoth/components/htm/button-outline'
import { TextInput } from '@nichoth/components/htm/text-input'
import { createDebug } from '@nichoth/debug'
import { State } from './state.js'
import '@nichoth/components/button-outline.css'
import '@nichoth/components/button.css'
import '@nichoth/components/text-input.css'
import './style.css'

const state = await State()
const debug = createDebug()

export function Example () {
    debug('rendering example...')

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

    async function createUser (ev:SubmitEvent) {
        ev.preventDefault()
        // @ts-expect-error broken upstream
        const name = ev.target!.elements.username.value
        await State.CreateUser(state, { name })
    }

    return html`<div class="content">
        <h1>Encryption, E2E</h1>

        <div>
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
        </div>

        ${state.me.value ?
            html`
                <div>You are: <strong>${state.me.value.humanName}</strong></div>
                <h2>Create a new thing to do</h2>

                <form onSubmit=${handleSubmit}>
                    <${TextInput}
                        name=${'name'}
                        displayName=${'something to do'}
                        required=${true}
                    />
                    <${Button} isSpinning=${false} type=${'submit'}>Submit<//>
                </form>

                <div class="push-pull-controls">
                    <${ButtonOutline} onClick=${() => State.Push(state)}>push<//>
                    <${ButtonOutline} onClick=${() => State.Pull(state)}>pull<//>
                </div>
            ` :
            html`<form
                class="create-user-controls"
                onSubmit=${createUser}
            >
                <${TextInput} name=${'username'} displayName=${'Your username'}
                    required=${true}
                />

                <${Button} isSpinning=${false} type=${'submit'}>
                    Create your identity
                <//>
            </form>`
        }


    </div>`
}

render(html`<${Example} />`, document.getElementById('root')!)
