'use strict'

const { parse } = require('url')

module.exports = async (ctx, next) => {
  const { cors } = ctx.app.config
  const { enable, whiteList, excludeList } = cors
  if (enable === false) {
    ctx.status = 404
    return
  }

  const { url = '' } = ctx.request.body
  let urlParsed

  try {
    urlParsed = parse(url)
  } catch (e) {
    ctx.status = 400
    ctx.body = {
      msg: 'URL parse faild'
    }
    return
  }

  const { host } = urlParsed
  if (host === null) {
    ctx.status = 400
    ctx.body = {
      msg: 'URL parse === null'
    }
    return
  }

  //  Check url in whiteList or excludeList, if there are both one, use whiteList
  if (Array.isArray(whiteList)) {
    if (!new Set(whiteList).has(host)) {
      ctx.status = 400
      ctx.body = {
        msg: 'URL not been permit'
      }
      return
    }
  } else if (Array.isArray(excludeList)) {
    if (new Set(excludeList).has(host)) {
      ctx.status = 400
      ctx.body = {
        msg: 'URL not been permit'
      }
      return
    }
  }

  await next()
}
