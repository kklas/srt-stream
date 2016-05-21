const duplexer = require('duplexer2')
const split = require('split2')
const through = require('through2')

const idRe = /^\d+$/
const posRe = /^(\d\d):(\d\d):(\d\d),(\d\d\d)$/

module.exports = function (onInvalid) {
  if (onInvalid && typeof onInvalid !== 'function') {
    throw new Error('argument must be a function')
  }

  var id = 0
  var time = {
    startTime: null,
    endTime: null
  }
  var body = []
  var state = 'new'

  const s = split()
  const t = through.obj(onLine, onEnd)
  s.pipe(t)
  return duplexer({readableObjectMode: true}, s, t)

  function onLine (line, enc, cb) {
    if (line === '') {
      if (state !== 'new') {
        pushSub.call(this)

        id = 0
        time = {
          startTime: null,
          endTime: null
        }
        body = []
        state = 'new'
      }

      return cb()
    } else if (line !== '' && state === 'new') state = 'id'

    if (state === 'id') {
      let match = idRe.exec(line)

      if (!match) {
        id = 0
      } else id = Number(match[0])

      state = 'time'
      return cb()
    }

    if (state === 'time') {
      let pos = line.split(' --> ')
      if (pos.length !== 2) {
        state = 'body'
        return cb()
      }

      let startTime = posRe.exec(pos[0])
      let endTime = posRe.exec(pos[1])

      if (startTime) {
        time.startTime = {
          hours: Number(startTime[1]),
          minutes: Number(startTime[2]),
          seconds: Number(startTime[3]),
          ms: Number(startTime[4])
        }
      }

      if (endTime) {
        time.endTime = {
          hours: Number(endTime[1]),
          minutes: Number(endTime[2]),
          seconds: Number(endTime[3]),
          ms: Number(endTime[4])
        }
      }

      state = 'body'
      return cb()
    }

    if (state === 'body') {
      body.push(line)
      return cb()
    }
  }

  function onEnd (cb) {
    if (state !== 'new') pushSub.call(this)
    cb()
  }

  function pushSub () {
    let valid = id && time.startTime && time.endTime && body.length > 0
    if (onInvalid && !valid) {
      var newSub = onInvalid(getSubObj())
      if (newSub) this.push(newSub)
    } else if (valid) this.push(getSubObj())
  }

  function getSubObj () {
    return {
      id,
      startTime: time.startTime,
      endTime: time.endTime,
      body
    }
  }
}
