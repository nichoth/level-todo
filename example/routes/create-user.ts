import { html } from 'htm/preact'
import { FunctionComponent } from 'preact'
import { useSignal } from '@preact/signals'
import { TextInput } from '@nichoth/components/htm/text-input'
import { Button } from '@nichoth/components/htm/button'
import { State } from '../state.js'

export const CreateUser:FunctionComponent<{
    state:Awaited<ReturnType<typeof State>>
}> = function CreateUser ({ state }) {
    const isValid = useSignal(false)
    const isSpinning = useSignal(false)

    async function createUser (ev:SubmitEvent) {
        ev.preventDefault()
        isSpinning.value = true
        // @ts-expect-error broken upstream
        const name = ev.target!.elements.username.value
        // @ts-expect-error broken upstream
        const humanReadableDeviceName = ev.target!.elements['deviceName'].value
        await State.CreateUser(state, { name, humanReadableDeviceName })
        isSpinning.value = false
        state._setRoute('/')
    }

    function handleInput (ev:InputEvent) {
        const _isValid = (ev.target as HTMLFormElement).checkValidity()
        if (_isValid !== isValid.value) isValid.value = _isValid
    }

    return html`<div class="route create-user">
        <h2>Create An Identity</h2>

        <form
            class="create-user-controls"
            onSubmit=${createUser}
            onInput=${handleInput}
        >
            <${TextInput} name=${'username'} displayName=${'Your username'}
                required minlength=${3}
            />

            <${TextInput}
                name=${'deviceName'}
                displayName=${'A name for this device'}
            />

            <${Button}
                isSpinning=${isSpinning}
                disabled=${!isValid.value}
                type=${'submit'}
            >
                Create your identity
            <//>
        </form>
    </div>
    `
}
