'use strict'

const http = require('http')

const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')

const WSServer = require('./ws-server')
const router = require('./app/router')
const WSRouter = require('./app/ws-router')
const util = require('./app/util')
const defaultConfig = require('./config/default')

const app = new Koa()

const deployment = process.env.DEPLOYMENT
let deploy
switch (deployment) {
  case 'heroku':
    deploy = 1
    break
  default:
    deploy = 0
    break
}

app.deploy = deploy

//  Load util to app
app.util = util

//  Load default config to app
app.config = defaultConfig
let privateConfig = {}
try {
  privateConfig = require('./config/private')
} catch (e) {
  console.log('No private config')
}
app.config = app.util.base.deepMerge(app.config, privateConfig)

//  Test catch all error
app.use(cors(app.config.corsAll))
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    console.log(e)
    ctx.status = 500
  }
})

//  Use bodyParser
app.use(bodyParser())

//  Load app to ctx for everyroute
app.use(async (ctx, next) => {
  ctx.app = app
  await next()
})

//  Use router
app
  .use(router.routes())
  .use(router.allowedMethods())

const server = http.createServer(app.callback())

//  Init websocket server
const ws = new WSServer(server, app)
ws.use(WSRouter)
app.ws = ws

//  Wrap for auto port
const port = deploy === 0 ? (app.config.server.port || process.env.PORT) : (process.env.PORT || app.config.server.port)
const { host } = deploy === 0 && app.config.server

if (host) {
  server.listen(port, host, () => console.log(`Server running at ${app.config.server.host}:${port}`))
} else {
  server.listen(port, () => console.log(`Server running at ${port}`))
}
