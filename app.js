import Fastify from "fastify";
import fastifyAutoload from "@fastify/autoload";
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import auth from "./auth/auth-jwt.js";
import { connect } from './database/database.js'
import UserService from "./services/userService.js";
import fastifyPlugin from "fastify-plugin";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envLogger = {
    developement: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
    production: true,
    test: false,
}

const fastify = Fastify({
    logger: envLogger['developement'] || true
})

//Autoload plugins from fastify ecosystem
fastify.register(fastifyAutoload, {
    dir: join(__dirname, 'plugins')
})

async function decorateFunctions(fastify) {
    const userService = new UserService(fastify)
    fastify.decorate('userService', userService)
}

fastify.register(auth)
fastify.register(fastifyPlugin(decorateFunctions))

//Autoload services
fastify.register(fastifyAutoload, {
    dir: join(__dirname, 'routes'),
    options: { prefix: '/api/v1' }
})

const start = async (port) => {
    try {
        await fastify.listen({port})
        await connect(fastify)
    } catch(error) {
        fastify.log.error(error)
        process.exit(1)
    } 
}

fastify.ready(async (err) => {
    if (err) console.log(err)
    const port = fastify.config.PORT
    start(port)    
})