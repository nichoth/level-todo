import { Handler, HandlerEvent } from '@netlify/functions'
import faunadb from 'faunadb'
import type { ParsedHeader } from '@bicycle-codes/request'
import { parseHeader, verifyParsed } from '@bicycle-codes/request'
import { DID, EncryptedMessage, createDeviceName } from '@bicycle-codes/identity'
import { Headers } from '../util.js'
import { Certificate } from '../../../example/routes/link-device.js'

const { Client } = faunadb
const q = faunadb.query

const client = new Client({
    secret: process.env.FAUNA_SECRET!
})

export const handler:Handler = async function handler (ev:HandlerEvent) {
    if (ev.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: Headers() }
    }

    if (ev.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: Headers()
        }
    }

    // verify the ID of the requester
    // is this device who they say they are?
    // in real life, you would check that they are on a list of allowed users
    let sigOk:boolean
    let parsedHeader:ParsedHeader
    try {
        parsedHeader = parseHeader(ev.headers.authorization!)
        sigOk = await verifyParsed(parsedHeader)
    } catch (err) {
        console.log('caught error', err)
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    if (!sigOk) {
        console.log('bad signature', parsedHeader)
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    const deviceName = await createDeviceName(parsedHeader.author)

    let req:{ certificate?:Certificate, username:DID }
    try {
        req = JSON.parse(ev.body!)
    } catch (err) {
        return { statusCode: 400, body: 'bad json', headers: Headers() }
    }

    // check the certificate iff the deviceName !== username
    // the certificate `author` is the parent device
    // certificate `sameAs` property is the new device
    if (deviceName !== req.username) {
        // check the certificate
        if (!req.certificate) {
            /**
             * @TODO -- check certificate is valid
             */
            return { statusCode: 401, headers: Headers() }
        }
    }

    try {
        const msg:{ data:EncryptedMessage } = await client.query(
            q.Get(q.Match(
                q.Index('todos_by_username'),
                req.username
            ))
        )

        const todos:EncryptedMessage = msg.data
        return {
            body: JSON.stringify(todos!),
            statusCode: 200,
            headers: Headers()
        }
    } catch (err) {
        if ((err as InstanceType<typeof Error>).toString().includes('not found')) {
            return {
                statusCode: 404,
                headers: Headers()
            }
        }

        return {
            statusCode: 500,
            headers: Headers(),
            body: (err as InstanceType<typeof Error>).toString()
        }
    }
}
