'use strict'

const requestService = require('../service/request')

module.exports = async (ctx, next) => {
  const { body } = ctx.request
  const { url, config = {}, data = {} } = body

  let result
  try {
    result = await requestService(url, config, data)
    result.data = result.buffer.toString()
    delete result.buffer
  } catch (e) {
    ctx.status = 500
    ctx.body = {
      msg: e.toString()
    }
    return
  }

  ctx.body = {
    data: result
  }
}
