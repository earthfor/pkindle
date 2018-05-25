'use strict'

const Router = require('koa-router')

const verifyMail = require('./controller/verify')
const pretreatPushBody = require('./middleware/pretreatPushBody')
const corsController = require('./controller/cors')
const corsCheck = require('./middleware/corsCheck')

const download = require('./controller/download')
const push = require('./controller/push')

const app = new Router()

app.get('/', async (ctx) => {
  ctx.body = `<a href="https://github.com/earthfor/push2kindle" >Github Repo</a>`
})

app.post('/mail', verifyMail)
app.get('/mail', async (ctx) => {
  ctx.body = {
    addr: (ctx.app.config.email && ctx.app.config.email.user) || ''
  }
})
app.post('/download', download)
app.post('/push', pretreatPushBody, push)
app.post('/cors', corsCheck, corsController)

module.exports = app
