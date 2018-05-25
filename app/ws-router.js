'use strict'

const path = require('path')
const bytes = require('bytes')

module.exports = (router) => {
  router.type('reconnect', (ctx, data) => {
    const { wss, ws } = ctx
    const { id } = ws
    const { id: reid } = data

    wss.replaceClientById(reid, id)
  })

  router.type('unzip-file', async (ctx, data) => {
    const { wss, ws, app } = ctx
    const { id } = ws
    const { path: filepath, fileId } = data
    const { config, util } = app
    const { path: uploadDir } = config.file

    if (filepath === undefined || fileId === undefined) {
      wss.sendMsgByIdQuiet(id, 'unzip-file', {
        id: fileId,
        err: 'Lack of filepath or fileId!'
      })
      return
    }

    const fullFilePath = util.base.pathJoin(uploadDir, filepath)
    let stats
    try {
      stats = await util.base.stat(fullFilePath)
    } catch (e) {
      wss.sendMsgByIdQuiet(id, 'unzip-file', {
        id: fileId,
        err: 'File Not Found!'
      })
      return
    }

    if (stats.isDirectory() || path.extname(filepath) !== '.zip') {
      wss.sendMsgByIdQuiet(id, 'unzip-file', {
        id: fileId,
        err: 'File is not zip file!'
      })
      return
    }

    const dest = `${fileId}_${Date.now()}`
    const fullDestPath = util.base.pathJoin(uploadDir, dest)

    try {
      await util.base.unzip(fullFilePath, fullDestPath)
    } catch (e) {
      wss.sendMsgByIdQuiet(id, 'unzip-file', {
        id: fileId,
        err: 'Unzip file faild!'
      })
      return
    }

    wss.sendMsgByIdQuiet(id, 'unzip-file', {
      id: fileId,
      path: dest
    })
  })

  router.type('ls-dir', async (ctx, data) => {
    const { wss, ws, app } = ctx
    const { id } = ws
    const { fileId, path: filepath } = data

    const { base } = app.util
    const { path: uploadDir } = app.config.file

    const fullFilePath = base.pathJoin(uploadDir, filepath)

    let result
    try {
      if (fullFilePath === uploadDir) {
        throw new Error()
      }

      const filepathStats = await base.stat(fullFilePath)
      if (!filepathStats.isDirectory()) throw new Error()

      const dir = await base.readdir(fullFilePath)
      const statTasks = []
      dir.forEach((f) => statTasks.push(base.stat(base.pathJoin(fullFilePath, f))))

      const stats = await Promise.all(statTasks)

      result = Array.from({ length: dir.length }).map((v, idx) => ({
        name: dir[idx],
        stats: {
          isDir: stats[idx].isDirectory(),
          size: bytes(stats[idx].size),
          birthtime: stats[idx].birthtime,
          mtime: stats[idx].mtime
        }
      }))
    } catch (e) {
      wss.sendMsgByIdQuiet(id, 'ls-dir', {
        id: fileId,
        err: 'Path is not directory or can not read directory!'
      })
      return
    }

    wss.sendMsgByIdQuiet(id, 'ls-dir', {
      id: fileId,
      data: result
    })
  })

  router.type('rename-file-or-dir', async (ctx, data) => {
    const { wss, ws, app } = ctx
    const { base } = app.util
    const { path: uploadDir } = app.config.file
    const { id } = ws
    const { fileId, path: filepath, newname } = data

    const fullFilePath = base.pathJoin(uploadDir, filepath)

    if (fileId === undefined || filepath === undefined || newname === undefined || fullFilePath === uploadDir) {
      wss.sendMsgByIdQuiet(id, 'rename-file-or-dir', {
        id: fileId,
        path: filepath,
        err: 'Lack of fileId or filepath or newname'
      })
      return
    }

    let newpath
    try {
      await base.stat(fullFilePath)
      await base.replaceName(fullFilePath, newname)

      newpath = base.pathJoin(base.pathDirname(filepath), newname)
    } catch (e) {
      wss.sendMsgByIdQuiet(id, 'rename-file-or-dir', {
        id: fileId,
        path: filepath,
        err: 'Unexpect file id or file path or new name'
      })
      return
    }

    wss.sendMsgByIdQuiet(id, 'rename-file-or-dir', {
      id: fileId,
      oldpath: filepath,
      path: newpath,
      rename: true
    })
  })

  router.type('zip-file', async (ctx, data) => {
    const { wss, ws, app } = ctx
    const { id } = ws
    const { fileId, path: filepath } = data

    const { base } = app.util
    const { path: uploadDir } = app.config.file

    if (fileId === undefined || filepath === undefined) {
      wss.sendMsgByIdQuiet(id, 'zip-file', {
        id: fileId,
        err: 'Unexpect body!'
      })
      return
    }

    const finalFilePath = !Array.isArray(filepath)
      ? [base.pathJoin(uploadDir, filepath)]
      : filepath.map(f => base.pathJoin(uploadDir, f))

    if (finalFilePath.some(f => f === uploadDir)) {
      wss.sendMsgByIdQuiet(id, 'zip-file', {
        id: fileId,
        err: 'Unexpect body!'
      })
      return
    }

    const destName = `${fileId}_${Date.now()}.zip`
    const dest = base.pathJoin(uploadDir, destName)

    try {
      await base.zip(finalFilePath, dest)
      console.log(2333)
    } catch (e) {
      wss.sendMsgByIdQuiet(id, 'zip-file', {
        id: fileId,
        err: 'Unabled to zip file!'
      })
      return
    }

    wss.sendMsgByIdQuiet(id, 'zip-file', {
      id: fileId,
      path: destName
    })
  })
}
