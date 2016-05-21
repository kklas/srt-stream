const through = require('through2')

module.exports = function () {
  let first = true
  return through({writableObjectMode: true}, onSub)

  function onSub (sub, enc, cb) {
    if (!first) this.push('\n')
    else first = false

    this.push(String(sub.id) + '\n')

    let startTime = getTimeString(sub.startTime)
    let endTime = getTimeString(sub.endTime)
    this.push(`${startTime} --> ${endTime}\n`)

    sub.body.map(line => {
      this.push(line + '\n')
    })

    cb()
  }

  function getTimeString (t) {
    let h = ('0' + t.hours).slice(-2)
    let m = ('0' + t.minutes).slice(-2)
    let s = ('0' + t.seconds).slice(-2)
    let ms = ('00' + t.ms).slice(-3)
    return `${h}:${m}:${s},${ms}`
  }
}
