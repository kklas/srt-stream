const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const Readable = require('readable-stream').Readable
const srtread = require('../').read
const test = require('tape')
const through = require('through2')

test('read stream is in object mode', t => {
  t.plan(2)
  t.ok(srtread()._readableState.objectMode)
  t.notOk(srtread()._writableState.objectMode)
})

test('last sub flushes properly', t => {
  let rs = new Readable()
  rs.push('some line')
  rs.push(null)

  rs.pipe(srtread()).resume().on('end', () => t.end())
})

test('read valid sub', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './single/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'single/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread())
    .pipe(through.obj(function (sub, enc, next) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      next()
    }))
})

test('onInvalid callback: must be a function', t => {
  t.plan(1)
  t.throws(srtread.bind(this, 'string'))
})

test('onInvalid callback: shouldnt be called when valid', t => {
  let p = path.join(__dirname, 'single/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) { t.fail() }))
    .pipe(through.obj(function (sub, enc, next) {
      next()
      t.end()
    }))
})

test('onInvalid callback: push through', t => {
  t.plan(2)
  let rs = new Readable()
  rs.push('3\ninvalid')
  rs.push(null)

  let exp = {
    id: 3,
    startTime: null,
    endTime: null,
    body: []
  }

  rs.pipe(srtread(function (sub) {
    t.deepEqual(sub, exp, 'invalid sub is in callback')
    sub.id = 4
    exp.id = 4
    return sub
  }))
  .pipe(through.obj(function (sub, enc, next) {
    t.deepEqual(sub, exp, 'corrected sub was properly pushed through')
    next()
  }))
})

test('onInvalid callback: nothing goes through when nothing pushed', t => {
  t.plan(1)
  let rs = new Readable()
  rs.push('3\ninvalid')
  rs.push(null)

  rs.pipe(srtread(function (sub) {
    t.ok('onInvalid callback is called')
  }))
    .pipe(through.obj(function (sub, enc, next) {
      t.fail('shouldnt be called because we didnt push anything')
    }))
})

test('onInvalid callback: invalid sub doesnt get pushed through by default', t => {
  let rs = new Readable()
  rs.push('3\ninvalid')
  rs.push(null)

  rs.pipe(srtread())
    .pipe(through.obj(function (sub, enc, next) {
      next()
      t.fail('shouldnt be called because sub is invalid and onInvalid is not defined')
    }))
    .on('end', () => t.end()).resume()
})

test('invalid id', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './invalid_id/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'invalid_id/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      return sub
    }))
})

test('invalid time', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './invalid_time/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'invalid_time/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      return sub
    }))
})

test('invalid start time', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './invalid_start_time/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'invalid_start_time/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      return sub
    }))
})

test('invalid end time', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './invalid_end_time/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'invalid_end_time/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      return sub
    }))
})

test('multiple', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './multiple/expected.json'))
  t.plan(expected.length)

  let p = path.join(__dirname, 'multiple/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
    }))
    .pipe(through.obj(function (sub, enc, next) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      next()
    }))
})

test('proper handling of incomplete subs', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, './incomplete/expected.json'))
  t.plan(expected.length + 1)

  let p = path.join(__dirname, 'incomplete/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
    }))
    .pipe(through.obj(function (sub, enc, next) {
      t.fail('should not be valid!')
      next()
    }))
    .resume().on('end', () => {
      t.pass()
    })
})

test('dont flush empty newlines on the end of file', t => {
  let expected = jsonfile.readFileSync(path.join(__dirname, 'newlines/expected.json'))
  t.plan(expected.length + 1)

  let p = path.join(__dirname, 'newlines/sub.srt')
  fs.createReadStream(p)
    .pipe(srtread(function (sub) {
      t.fail('should not be invalid!')
    }))
    .pipe(through.obj(function (sub, enc, next) {
      let exp = expected.shift()
      t.deepEqual(sub, exp)
      next()
    }))
    .resume().on('end', () => {
      t.pass()
    })
})
