// import { html } from 'htm/preact'
import { Connect } from './connect.js'
import Router from '@nichoth/routes'
import { HomeRoute } from './home.js'

export default function _Router ():ReturnType<Router> {
    const router = new Router()

    router.addRoute('/', () => {
        return HomeRoute
    })

    router.addRoute('/connect', () => {
        return Connect
    })

    /**
     * Visit this from an existing device
     * This creates the websocket room, and will listen for a message
     * from the new device.
     */
    router.addRoute('/link-device', () => {
        return LinkDevice
    })

    return router
}
