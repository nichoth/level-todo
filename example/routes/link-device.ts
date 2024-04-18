import { html } from 'htm/preact'
import { FunctionComponent } from 'preact'
import { useEffect } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import { PartySocket } from 'partysocket'
import { customAlphabet } from '@nichoth/nanoid'
import { numbers } from '@nichoth/nanoid-dictionary'
import { State } from '../state.js'
import { addDevice } from '@bicycle-codes/identity'
import Debug from '@nichoth/debug'
import '@nichoth/components/text-input.css'
const debug = Debug()

const PARTY_URL = (import.meta.env.DEV ?
    'localhost:1999' :
    'identity-party.nichoth.partykit.dev')

type Message = {
    newDid:`did:key:z${string}`;
    deviceName:string;
    exchangeKey:string;
    humanReadableDeviceName:string;  // <-- a name for the new device
}

/**
 * Visit this route from an existing device.
 * Create a PIN, and ask the new device to enter the PIN.
 * So you have to transmit the PIN out of band.
 */

export const LinkDevice:FunctionComponent<{
    state:Awaited<ReturnType<typeof State>>
}> = function ({ state }) {
    const code = useSignal<string>('')

    useEffect(() => {
        /**
         * @TODO
         * Use full (lowercase) alphabet, for less chance of collision?
         */
        const PIN = customAlphabet(numbers, 6)
        code.value = ('' + PIN())

        /**
         * connect to our server
         * @TODO -- use a real token
         */
        const partySocket = new PartySocket({
            host: PARTY_URL,
            room: code.value,
            // id: state.me.value?.rootDID,
            query: {
                token: '894b4ec9'
            },
        })

        partySocket.addEventListener('message', async (ev) => {
            // we should only get one message containing the DID
            //   and exchangeKey and deviceName of the new device

            let msg:Message
            try {
                msg = JSON.parse(ev.data)
            } catch (err) {
                console.error(err)
                throw new Error('bad json')
            }

            debug('got a message from the new device', msg)

            const {
                newDid,
                exchangeKey,
                deviceName,
                humanReadableDeviceName
            } = msg

            if (!newDid || !exchangeKey || !deviceName) {
                throw new Error('bad message')
            }

            // our own identity should exist at this point
            if (!state.me.value) throw new Error('not identity')

            const newIdentity = await addDevice(
                state.me.value,
                state._crypto,
                newDid,
                exchangeKey,
                humanReadableDeviceName
            )

            debug('got the new identity', newIdentity)

            State.AddDevice(state, newIdentity)

            partySocket.send(JSON.stringify(newIdentity))
            partySocket.close()
        })

        return () => partySocket.close()
    }, [])

    return html`<div class="route link">
        <h2>Add a new device to this identity</h2>

        <div className="the-pin">
            <p>
                Visit <code>'/connect' </code>on the new device,
                and enter this PIN.
            </p>
            <p class="the-code">
                <code>${code}</code>
            </p>
        </div>
    </div>`
}

