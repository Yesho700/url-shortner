

export default () => {
    return Object.freeze({
        app: {
            port: process.env.PORT
        },

        db: {
            uri: process.env.MONGO_URI
        },

        redis: {
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST
        },

        rate: {
            limit: process.env.RATE_LIMIT,
            window: process.env.RATE_WINDOW
        }
    })
}