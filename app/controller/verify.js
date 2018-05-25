'use strict'

const Mailer = require('../service/mail')

module.exports = async (ctx) => {
  const { from: fromMail, pwd: fromPwd, smtp: fromSmtp } = ctx.request.body

  if (fromMail === undefined || fromPwd === undefined || fromSmtp instanceof Object !== true) {
    ctx.status = 400
    ctx.body = {
      msg: 'Unexpect Body'
    }
    return
  }

  const mailer = new Mailer({ fromMail, fromPwd, fromSmtp })

  try {
    await mailer.verify()
  } catch (e) {
    ctx.status = 400
    ctx.body = {
      msg: e.toString()
    }
    return
  }

  ctx.status = 202
}
