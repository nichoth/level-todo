export function Headers () {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, DELETE, POST, OPTIONS',
        'Access-Control-Allow-Headers':
            'Content-Type, Access-Control-Allow-Headers, X-Requested-With, Authorization'
    }
}
