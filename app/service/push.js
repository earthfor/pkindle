'use strict'

const glob = require('glob')
const rimraf = require('rimraf')

const Mailer = require('./mail')

module.exports = async ({app, fileId, wsid, dest, filename, from, to}) => {
  const { ws } = app
  const { path: uploadDir } = app.config.file
  const { base } = app.util
  const mailer = new Mailer(from)

  try {
    await mailer.verify()
    await mailer.send({
      to,
      attachments: Array.isArray(dest)
        ? dest.map(f => ({
          filename: f.filename,
          path: base.pathJoin(uploadDir, typeof f === 'string' ? f : f.path)
        }))
        : [{
          filename,
          path: base.pathJoin(uploadDir, dest)
        }]
    })
  } catch (err) {
    ws.sendMsgByIdQuiet(wsid, 'push-file-end', {
      id: fileId,
      err: 'Can not push file to email account, please recheck mail account or content!'
    })
  }

  ws.sendMsgByIdQuiet(wsid, 'push-file-end', {
    mailed: true,
    id: fileId
  })

  if (app.deploy !== 0) {
    glob.glob(base.pathJoin(uploadDir, `${fileId}*`), (err, files) => {
      if (err) {
        return
      }

      //  Remove file by id and ignore error
      files.forEach(f => rimraf(f, (err) => {
        if (err) {
          console.log(err)
        }
      }))
    })
  }
}
