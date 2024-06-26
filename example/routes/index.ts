import Router from '@nichoth/routes'
import { LinkDevice } from './link-device.js'
import { CreateUser } from './create-user.js'
import { Connect } from './connect.js'
import { HomeRoute } from './home.js'
import { Devices } from './devices.js'

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

    router.addRoute('/create-user', () => {
        return CreateUser
    })

    router.addRoute('/devices', () => {
        return Devices
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
