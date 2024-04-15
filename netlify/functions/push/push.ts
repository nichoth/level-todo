import { Handler, HandlerEvent } from '@netlify/functions'
import faunadb from 'faunadb'
import { parseHeader, verifyParsed } from '@bicycle-codes/request'

const { Client } = faunadb
const q = faunadb.query

const client = new Client({
    secret: process.env.FAUNADB_SERVER_SECRET!
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
        return { statusCode: 401, body: 'Unauthorized' }
    }

    if (!sigOk) {
        // in real life, we would need to check that `parsedHeader.author`
        // is allowed to use our server
        return { statusCode: 401, body: 'Unauthorized' }
    }

    if (ev.httpMethod === 'POST') {
        // write state
        client.query(q.Create({
            // todo
        }))
    }

    if (ev.httpMethod === 'DELETE') {
        // delete a list
    }

    return { statusCode: 405 }
}

function Headers () {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
            'Content-Type, Access-Control-Allow-Headers, X-Requested-With, Authorization'
    }
}
