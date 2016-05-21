const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const srtwrite = require('../').write
const test = require('tape')
const through = require('through2')

test('write stream is in object mode', t => {
  t.plan(2)
  t.ok(srtwrite()._writableState.objectMode)
  t.notOk(srtwrite()._readableState.objectMode)
})

test('single sub written correctly', t => {
  t.plan(1)

  let expected = fs.createReadStream(path.join(__dirname, 'single/sub.srt'))
  let sub = jsonfile.readFileSync(path.join(__dirname, 'single/expected.json'))[0]
  let stream = srtwrite()
  stream.end(sub)

  compareStreams(t, stream, expected)
})

test('multiple subs written correctly', t => {
  t.plan(1)

  let expected = fs.createReadStream(path.join(__dirname, 'double/sub.srt'))
  let subs = jsonfile.readFileSync(path.join(__dirname, 'double/expected.json'))
  let stream = srtwrite()
  subs.map(sub => {
    stream.write(sub)
  })
  stream.end()

  compareStreams(t, stream, expected)
})

function compareStreams (t, s1, s2) {
  let done = 0

  let s1str = ''
  let s2str = ''

  s1.pipe(through(function (chunk, enc, cb) {
    s1str += chunk.toString()
    cb()
  }))
  s2.pipe(through(function (chunk, enc, cb) {
    s2str += chunk.toString()
    cb()
  }))

  s1.on('end', onEnd)
  s2.on('end', onEnd)

  function onEnd () {
    done++
    if (done < 2) return
    t.equal(s1str, s2str)
  }
}
