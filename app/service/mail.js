'use strict'

const util = require('util')

const nodemailer = require('nodemailer')

class Mailer {
  constructor ({ email, pwd, smtp }) {
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: email,
        pass: pwd
      },
      logger: false,
      debug: false
    }, {
      from: `PushToKindle <${email}>`
    })
  }

  async verify () {
    const { transporter } = this
    await util.promisify(transporter.verify).bind(transporter)()
  }

  async send ({ attachments, to }) {
    const { transporter } = this
    const sendOptions = {
      to,
      attachments
    }

    await util.promisify(transporter.sendMail).bind(transporter)(sendOptions)
  }

  async sendStream ({ attachments, to }) {
    const { transporter } = this
    const sendOptions = {
      to,
      attachments
    }

    await util.promisify(transporter.sendMail).bind(transporter)(sendOptions)
  }

  close () {
    this.transporter.close()
  }
}

module.exports = Mailer
