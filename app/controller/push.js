'use strict'

const push = require('../service/push')

module.exports = async (ctx) => {
  const { app } = ctx
  const { validator } = app.util.base
  const {
    wsid,
    path: dest,
    from,
    to,
    fileId,
    filename
  } = ctx.request.body

  const istoMail = validator.isEmail(to)
  const isFromMail = validator.isEmail(from.email)
  if (!istoMail || !isFromMail || from.pwd === undefined) {
    ctx.status = 400
    ctx.body = {
      msg: 'Invalid body'
    }
    return
  }

  //  Check to mail address is official kindle address
  const emailWhiteList = app.config.email.whiteList || []
  const emailSuffix = to.replace(/.*@/, '')
  const emailSuffixValid = emailWhiteList.indexOf(emailSuffix) !== -1
  if (!emailSuffixValid) {
    ctx.status = 400
    ctx.body = {
      msg: 'To email should be official kindle address'
    }
    return
  }

  push({ app, fileId, wsid, dest, filename, from, to })

  ctx.status = 202
}
