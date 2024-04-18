import { Handler, HandlerEvent } from '@netlify/functions'
import faunadb from 'faunadb'
import type { ParsedHeader } from '@bicycle-codes/request'
import { parseHeader, verifyParsed } from '@bicycle-codes/request'
import { EncryptedMessage, createDeviceName } from '@bicycle-codes/identity'
import { Headers } from '../util.js'

const { Client } = faunadb
const q = faunadb.query

const client = new Client({
    secret: process.env.FAUNA_SECRET!
})

export const handler:Handler = async function handler (ev:HandlerEvent) {
    if (ev.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: Headers() }
    }

    // verify the ID of the requester
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

    const username = await createDeviceName(parsedHeader.author)

    const todos:{ data: EncryptedMessage } = await client.query(
        q.Get(q.Match(
            q.Index('todos_by_username'),
            username
        ))
    )

    return {
        body: JSON.stringify(todos.data),
        statusCode: 200,
        headers: Headers()
    }
}
