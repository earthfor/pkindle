'use strict'

const path = require('path')

module.exports = {
  file: {
    path: path.join(__dirname, '..', 'upload'),
    whiteList: ['zip', 'txt', 'mobi', 'azw', 'doc', 'docx', 'html', 'htm', 'rtf', 'jpeg', 'jpg', 'gif', 'png', 'bmp', 'pdf'],
    limit: '50mb'
  },
  email: {
    whiteList: ['kindle.cn', 'kindle.com']
  },
  server: {
    host: '0.0.0.0',
    port: '5000'
  },
  //  There is not server cors config, just config for /cors path
  cors: {
    enable: true,
    whiteList: ['qidian.com', 'www.qidian.com']
  },
  corsAll: {}
}
