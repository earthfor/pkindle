'use strict'

const http = require('http')
const https = require('https')
const fs = require('fs')
const { URL } = require('url')
const path = require('path')

const fileType = require('file-type')
const bytes = require('bytes')
const progress = require('progress-stream')

const defaultHeaders = require('../constant/header')

function main ({ app, fileURL: url, headers: reqHeaders, fileName, fileId: id, wsid }) {
  return new Promise((resolve, reject) => {
    const { ws } = app
    const fileConfig = app.config.file
    const request = url.startsWith('https://') ? https : http
    const preExt = '.noname'
    fileName = fileName || `${id}${preExt}` //  Generator File name while no filename input
    let dest
    let name
    let fileTypeOK = false

    const options = new URL(url)
    options.headers = Object.assign({}, defaultHeaders, reqHeaders)
    options.timeout = 30000

    const req = request.get(options, (res) => {
      const { headers } = res

      //  Get file length
      const { limit = '50mb', whiteList } = fileConfig
      const length = headers['content-length'] || 0

      if (bytes(length) > bytes(limit)) {
        req.abort()
        const err = new Error(`File length can't more than ${limit}`)
        ws.sendMsgByIdQuiet(wsid, 'file-downloading', {
          id,
          name,
          url,
          err: err.toString()
        })
        reject(err)
        return
      }

      //  Get filename
      const disposition = headers['content-disposition'] || ''
      const filenameRaw = disposition.split(';').find(item => item.startsWith('filename')) || ''
      const filenameDecode = decodeURI(filenameRaw)
      const filename = filenameDecode.slice(filenameDecode.indexOf('=') + 1)
      name = filename !== '' ? filename : fileName
      const fixname = `${id}_${name}` //  Add prefix
      const uploadDir = fileConfig.path

      //  Config progress
      let str = progress({
        length,
        time: 100
      })

      str.on('progress', p => {
        //  WebSocket send data
        fileTypeOK && ws.sendMsgByIdQuiet(wsid, 'file-download', {
          id,
          name,
          url,
          p
        })
      })

      //  Start download
      dest = app.util.base.pathJoin(uploadDir, fixname)
      const fileStream = fs.createWriteStream(dest)

      res
        .pipe(str)
        .pipe(fileStream)

      //  Check file type
      res.once('data', (chunk) => {
        const type = fileType(chunk) || {}
        const checkType = whiteList.indexOf(type.ext) !== -1
        if (!checkType) {
          req.abort()
          res.destroy()
          if (str) str.destroy()
          if (fileStream) fileStream.destroy()

          const err = new Error('File type invalid')
          ws.sendMsgByIdQuiet(wsid, 'file-downloading', {
            id,
            name,
            url,
            err: err.toString()
          })
          reject(err)
          return
        }
        //  if name === '*.noname' reset name
        if (path.extname(name) === preExt) {
          name = `${path.basename(name, preExt)}.${type.ext}`
        }
        fileTypeOK = true
      })

      //  Wrap for no header['content-length']
      if (length === 0) {
        let size
        res.on('data', (chunk) => {
          size += chunk.length

          if (bytes(size) > bytes(limit)) {
            req.abort()
            if (str) str.destroy()
            if (fileStream) fileStream.destroy()

            const err = new Error(`File length can't more than ${limit}`)

            ws.sendMsgByIdQuiet(wsid, 'file-downloading', {
              id,
              name,
              url,
              err: err.toString()
            })
            reject(err)
          }
        })
      }

      //  Response error handle
      res.on('error', (err) => {
        res.destroy()
        if (str) str.destroy()
        if (fileStream) fileStream.destroy()

        ws.sendMsgByIdQuiet(wsid, 'file-downloading', {
          id,
          name,
          url,
          err: err.toString()
        })
        reject(err)
      })

      //  Download File
      fileStream.on('finish', () => {
        if (!fileTypeOK) {
          reject(new Error('Not allowd file type'))
          return
        }

        resolve({
          id,
          name,
          url,
          dest: fixname
        })
      })
    }).on('error', err => {
      if (dest) fs.unlink(dest)
      ws.sendMsgByIdQuiet(wsid, 'file-downloading', {
        id,
        name,
        url,
        err: err.toString()
      })
      reject(err)
    })
  })
}

module.exports = main
