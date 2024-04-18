import 'dotenv/config'
import { Handler, HandlerEvent } from '@netlify/functions'
import faunadb from 'faunadb'
import { ParsedHeader, parseHeader, verifyParsed } from '@bicycle-codes/request'
import { createDeviceName } from '@bicycle-codes/identity'
import { Headers } from '../util.js'
import type { EncryptedMessage } from '@bicycle-codes/identity'
// import type { DomainMessage } from '../../../example/state.js'

const { Client } = faunadb
const q = faunadb.query

const client = new Client({
    secret: process.env.FAUNA_SECRET!
})

// type EncryptedDomainMessage = DomainMessage & {
//     content:string  // content is encrypted before it gets to the server
// }

/**
 * Here we overwrite the state in the database.
 *
 * Could we do something smarter about state reconciliation?
 *
 * We take the hash of the metadata, so we can see if state is diverging.
 *
 * It would be kind of like in command line git. Our server would need to
 * reject a `push` if the `prev` hash in the push is not the latest
 * one we have.
 */

export const handler:Handler = async function handler (ev:HandlerEvent) {
    if (ev.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: Headers() }
    }

    let sigOk
    let parsedHeader:ParsedHeader

    try {
        parsedHeader = parseHeader(ev.headers.authorization!)
        sigOk = await verifyParsed(parsedHeader)
    } catch (err) {
        console.log('errr parsing', err)
        // console.log('ev headers', ev.headers)
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    if (!sigOk) {
        // in real life, we would check that the incoming DID,
        // `parsedHeader.author`, is allowed to use our server

        // here we are just checking that the author is who they say
        // they are

        console.log('not signature ok', parsedHeader)
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    let body:EncryptedMessage
    try {
        body = JSON.parse(ev.body!)
    } catch (err) {
        return { statusCode: 400, headers: Headers() }
    }

    const { username } = body.creator

    if (
        (await createDeviceName(parsedHeader.author)) !==
        body.creator.username
    ) {
        return { statusCode: 401, headers: Headers(), body: 'Unauthorized' }
    }

    /**
     * We get all todos as a single chunk, encrypted
     */
    if (ev.httpMethod === 'POST') {
        // upsert the todo list
        await client.query(
            q.Let(
                {
                    match: q.Match(q.Index('todos_by_username'), username)
                },
                q.If(
                    q.Exists(q.Var('match')),

                    q.Update(
                        q.Select('ref', q.Get(q.Var('match'))),
                        { data: body }
                    ),

                    q.Create(
                        q.Collection('todo'),
                        { data: body }
                    )
                )
            )
        )

        return {
            statusCode: 200,
            headers: Headers(),
            body: JSON.stringify({ ok: 'ok' })
        }
    }

    if (ev.httpMethod === 'DELETE') {
        // delete a list
    }

    return { statusCode: 405, headers: Headers() }
}
