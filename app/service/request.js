'use strict'

const http = require('http')
const https = require('https')
const { parse } = require('url')

const defaultHeaders = require('../constant/header')

module.exports = async (url, config = {}, data = {}) => {
  const { request } = url.startsWith('https://') ? https : http
  const urlObj = parse(url)

  config.headers = Object.assign({}, defaultHeaders)

  const options = Object.assign({}, urlObj, { timeout: 5000 }, config)

  const response = await new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      let buf = Buffer.alloc(0)
      res.on('data', chunk => (buf = Buffer.concat([buf, chunk])))
      res.on('end', () => {
        resolve({
          headers: res.headers,
          status: res.statusCode,
          buffer: buf
        })
      })
      res.on('error', err => reject(err))
    })
    req.write(JSON.stringify(data))
    req.on('error', err => reject(err))
  })

  return response
}
