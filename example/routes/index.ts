import Router from '@nichoth/routes'
import { LinkDevice } from './link-device.js'
import { Connect } from './connect.js'
import { HomeRoute } from './home.js'

export default function _Router ():ReturnType<Router> {
    const router = new Router()

    router.addRoute('/', () => {
        return HomeRoute
    })

    /**
     * This route is for new devices.
     */
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
