import { Handler, HandlerEvent } from '@netlify/functions'
import faunadb from 'faunadb'
import { parseHeader, verifyParsed } from '@bicycle-codes/request'
import { createDeviceName } from '@bicycle-codes/identity'

const { Client } = faunadb
const q = faunadb.query

const client = new Client({
    secret: process.env.FAUNA_SECRET!
})

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

    const parsedHeader = parseHeader(ev.headers.Authorization!)
    let sigOk
    try {
        sigOk = await verifyParsed(parsedHeader)
    } catch (err) {
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    if (!sigOk) {
        // in real life, we would need to check that `parsedHeader.author`
        // is allowed to use our server
        return { statusCode: 401, body: 'Unauthorized', headers: Headers() }
    }

    let body
    try {
        body = JSON.parse(ev.body!)
    } catch (err) {
        return { statusCode: 400, headers: Headers() }
    }

    if (ev.httpMethod === 'POST') {
        // create a todo item
        client.query(q.Create(
            q.Collection('todo', { data: body })
        ))
    }

    if (ev.httpMethod === 'DELETE') {
        // delete a list
    }

    return { statusCode: 405, headers: Headers() }
}

function Headers () {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, DELETE, POST, OPTIONS',
        'Access-Control-Allow-Headers':
            'Content-Type, Access-Control-Allow-Headers, X-Requested-With, Authorization'
    }
}
