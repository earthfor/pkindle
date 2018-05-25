'use strict'

module.exports = async (ctx, next) => {
  const { app } = ctx
  const { email = {} } = app.config
  const { body } = ctx.request
  const { to: toMail, from = {}, path: dest } = body

  //  Check must need argvs
  if (dest === undefined || toMail === undefined) {
    ctx.status = 400
    ctx.body = {
      msg: 'Needs file destination or to email!'
    }
    return
  }

  if (from.email === undefined || from.pwd === undefined || from.smtp === undefined) {
    if (email.passwd === undefined || email.user === undefined) {
      ctx.status = 400
      ctx.body = {
        msg: 'Needs from email account!'
      }
      return
    }
    const { user, passwd, smtp } = email

    Object.assign(body, {
      from: {
        email: user,
        pwd: passwd,
        smtp
      }
    })
  }

  await next()
}
