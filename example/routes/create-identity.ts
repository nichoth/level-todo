import { html } from 'htm/preact'
import { TextInput } from '@nichoth/components/htm/text-input'
import { Button } from '@nichoth/components/htm/button'
import { State } from '../state.js'

export function CreateId ({ state }) {
    async function createUser (ev:SubmitEvent) {
        ev.preventDefault()
        // @ts-expect-error broken upstream
        const name = ev.target!.elements.username.value
        await State.CreateUser(state, { name })
    }

    return html`<div class="route create-identity">
        <h2>Create An Identity</h2>

        <form
            class="create-user-controls"
            onSubmit=${createUser}
        >
            <${TextInput} name=${'username'} displayName=${'Your username'}
                required=${true}
            />

            <${Button} isSpinning=${false} type=${'submit'}>
                Create your identity
            <//>
        </form>
    `
}
