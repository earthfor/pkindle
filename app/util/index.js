'use strict'

const util = require('util')
const fs = require('fs')
const path = require('path')
const url = require('url')

const uuid = require('uuid/v4')
const validator = require('validator')
const _ = require('lodash')
const deepmerge = require('deepmerge')
const unzipper = require('unzipper')
const archiver = require('archiver')

class Base {
  static isURL (input) {
    let result
    try {
      url.parse(input)
      result = true
    } catch (e) {
      result = false
    }

    return result
  }
  static zip (input, dest) {
    return new Promise((resolve, reject) => {
      if (typeof input === 'string') {
        input = [input]
      }

      const tasks = []
      input.forEach(f => tasks.push(Base.stat(f)))
      Promise.all(tasks).then((stats) => {
        const archive = archiver('zip', {
          zlib: { level: 9 }
        })
        archive.on('error', e => reject(e))

        const writeStream = Base.createWriteStream(dest)

        archive
          .pipe(writeStream)
          .on('error', e => {
            reject(e)
            archive.destroy()
            writeStream.destroy()
          })
          .on('finish', () => resolve())

        stats.forEach((s, idx) => {
          const filepath = input[idx]
          const isDir = s.isDirectory()
          const name = Base.pathBasename(filepath)

          if (!isDir) {
            archive.file(filepath, { name })
            return
          }

          archive.directory(filepath, name)
        })

        archive.finalize()
      }).catch(e => reject(e))
    })
  }
  static unzip (input, output) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(input)
        .pipe(unzipper.Extract({ path: output }))
        .on('finish', () => resolve())
        .on('error', err => reject(err))
    })
  }
  static replaceName (input, name) {
    const newpath = this.pathJoin(path.dirname(input), name)
    return util.promisify(fs.rename)(input, newpath).then(() => Promise.resolve(newpath))
  }
  static deepMerge (...arg) {
    return deepmerge(...arg)
  }
  static createWriteStream (dest) {
    return fs.createWriteStream(dest)
  }
  static pathJoin (...args) {
    const safePathArgs = args.map(v => v === '..' ? '' : path.normalize(v).replace(/^(\.\.[/\\])+/, ''))
    return path.join(...safePathArgs)
  }
  static pathDirname (input) {
    return path.dirname(input)
  }
  static pathBasename (input) {
    return path.basename(input)
  }
  static promisify (fn) {
    return util.promisify(fn)
  }
  static async readdir (dirpath) {
    const result = await Base.promisify(fs.readdir)(dirpath)
    return result
  }
  static async stat (filepath) {
    const result = await Base.promisify(fs.stat)(filepath)
    return result
  }
  static async readFile (...args) {
    const result = await Base.promisify(fs.readFile)(...args)
    return result
  }
  static get validator () {
    return validator
  }
  static get _ () {
    return _
  }
  static uuid () {
    return uuid()
  }
}

class Config {
  static get configPath () {
    return Base.pathJoin(__dirname, '..', '..', 'config', 'config.json')
  }
  static async fileExist () {
    let result

    const { configPath } = this
    try {
      await Base.stat(configPath)
      result = true
    } catch (e) {
      if (e.code === 'ENOENT') {
        result = false
      }
      throw e
    }

    return result
  }
  static async get () {
    const { configPath } = this
    const buffer = await Base.readFile(configPath)
    const config = buffer.toString()
    return JSON.parse(config)
  }
}

module.exports = {
  base: Base,
  config: Config
}
