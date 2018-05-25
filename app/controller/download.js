'use strict'

const { URL } = require('url')

const uuid = require('uuid/v4')

const downloadFile = require('../service/downloadFile')

module.exports = async (ctx, next) => {
  const { app } = ctx
  const { body } = ctx.request
  const {
    url: fileURL,
    headers,
    name: fileName,
    wsid
  } = body

  //  Check url
  let isURL
  try {
    isURL = !!(new URL(fileURL))
  } catch (e) {
    isURL = false
  }
  if (!isURL) {
    ctx.status = 400
    ctx.body = {
      msg: 'Invalid body'
    }
  }

  const fileId = uuid()

  //  Download file server, move controller to WebSocket
  downloadFile({ app, fileURL, headers, fileName, fileId, wsid }).then(async ({ id, name, dest }) => {
    app.ws.sendMsgById(wsid, 'file-download-complete', {
      id,
      name,
      dest
    })
  })

  //  Return 202 accept
  ctx.status = 202
  ctx.body = {
    id: fileId
  }
}
