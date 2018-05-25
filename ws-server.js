'use strict'

const WebSocket = require('ws')
const uuid = require('uuid/v4')

class WSServer {
  constructor (server, app) {
    const wss = new WebSocket.Server({ server })
    this.wss = wss
    wss.myClients = []
    wss.routes = {}

    //  Defined use function
    this.use = (routers) => routers(wss)

    wss.type = (type, ...cbs) => {
      const cbsPromisify = cbs.map((func) => async (...args) => {
        await func(...args)
      })
      wss.routes[type] = cbsPromisify || []
    }

    //  WebSocket first connect handle
    wss.on('connection', (ws) => {
      const id = uuid()
      ws.id = id
      ws.customerData = {}

      //  Push new ws client to clients
      this.addClient(ws)

      //  Send id to web client
      this.sendMsgById(id, 'connected', { id })

      ws.on('message', (msg) => {
        let msgObj
        try {
          msgObj = JSON.parse(msg)
        } catch (e) {
          typeof wss.routes['__default'] === 'function' && wss.routes['__default'](msg)
          return
        }

        const { type, data } = msgObj

        wss.routes[type].reduce((last, now) => last.then(() => now(Object.assign({}, { wss: this, ws, app }), data)), Promise.resolve())
      })

      ws.on('close', (code, reason) => {
        //  Check close code isn't normal. src: "https://developer.mozilla.org/zh-CN/docs/Web/API/CloseEvent"
        if (code <= 1000 || code === 1005) {
          //  Client ws exit normally, remove from this.clients
          this.removeClientById(ws.id)
          return
        }
        console.info(`${ws.id} closed! reason: ${reason}, code: ${code}`)
      })
    })
  }

  sendMsgById (id, type, data) {
    const ws = this.findClientById(id)
    if (ws === undefined) {
      throw new Error(`Can't find match client: ${id}`)
    }
    ws.send(JSON.stringify({type, data}))
  }

  sendMsgByIdQuiet (id, type, data) {
    let v
    try {
      this.sendMsgById(id, type, data)
      v = true
    } catch (e) {
      // console.log(e)
      v = false
    }
    return v
  }

  addClient (ws) {
    this.wss.myClients.push(ws)
  }

  removeClientById (id) {
    //  Maybe has problem
    this.wss.myClients.forEach((i, idx, arr) => {
      if (id === i.id) {
        arr.splice(idx, 1)
      }
    })
  }

  changeClientIdById (id, newId) {
    const ws = this.findClientById(id)
    ws.id = newId
  }

  findClientById (id) {
    return this.wss.myClients.find(v => v.id === id)
  }

  getClientDataById (id) {
    return this.findClientById(id).customerData
  }

  setClientDataById (id, value) {
    this.findClientById(id).customerData = value
  }

  replaceClientById (reid, id) {
    //  Get Old WS data
    let oldData
    try {
      this.getClientDataById(reid)
    } catch (e) {
      oldData = {}
    }

    //  Remove Old ws
    this.removeClientById(reid)

    //  Replace data
    this.setClientDataById(id, oldData)

    //  Need replace ws by id
    this.changeClientIdById(id, reid)
  }
}

module.exports = WSServer
