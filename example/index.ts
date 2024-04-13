import { html } from 'htm/preact'
import { render } from 'preact'
import { Button } from '@nichoth/components/htm/button'
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

    function handleSubmit (ev:SubmitEvent) {
        ev.preventDefault()
        const els = (ev.target! as HTMLFormElement).elements
        // @ts-expect-error broken upstream. See https://github.com/microsoft/TypeScript/issues/39003
        const name = els.name.value
        debug('got name', name)
        State.Create(state, { name })
    }

    return html`<div class="content">
        <h1>A demonstation of levelDB</h1>

        <div>
            <h2>The List</h2>
            ${Object.keys(state.todosSignal.value).length ?
                html`<ul class="todo-list">
                    ${state.todosSignal.value.map(([key, todo]) => {
                        const classes = todo.completed ? 'todo completed' : 'todo'

                        return html`<li key=${key} class=${classes}>
                            <input class="toggle" checked=${todo.completed}
                                type="checkbox"
                                name="done-status"
                                id="${key}"
                                data-id=${key}
                                onChange=${check}
                            />

                            <label>
                                ${todo.name}
                            </label>
                        </li>`
                    })}
                </ul>` :
                html`<em class="empty-list">none</em>`
            }
        </div>


        <h2>Create a new thing to do</h2>

        <form onSubmit=${handleSubmit}>
            <${TextInput}
                name=${'name'}
                displayName=${'something to do'}
                required=${true}
            />
            <${Button} isSpinning=${false} type=${'submit'}>Submit<//>
        </form>
    </div>`
}

render(html`<${Example} />`, document.getElementById('root')!)
