# srt-stream

#### A read/write stream for srt subtitles

[![Build Status](https://travis-ci.org/kklas/srt-stream.svg?branch=master)](https://travis-ci.org/kklas/srt-stream)
[![NPM Version](https://img.shields.io/npm/v/srt-stream.svg)](https://www.npmjs.com/package/srt-stream)

#### Note: This package is written in ES6 and as is, it will only work with nodejs versions 6 and higher.

## Install

```
npm install srt-stream
```

## Usage

### Append a line to every subtitle and write to new file

``` js
const fs = require('fs')
const srt = require('srt-stream')
const through = require('through2')

fs.createReadStream('subtitle.srt')
  .pipe(srt.read())
  .pipe(through.obj(function (sub, enc, next) {
    sub.body.push('This line is added to every sub.')
    this.push(sub)
    next()
  }))
  .pipe(srt.write())
  .pipe(fs.createWriteStream('subtitle_new.srt'))
```

By default invalid subs are ignored.

`read` takes `onInvalid (sub)` callback in which you can return a sub object and it will get pushed through the stream.

### Push invalid subs through

``` js
const fs = require('fs')
const srt = require('srt-stream')

fs.createReadStream('subtitle.srt')
  .pipe(srt.read(function onInvalid (sub) { 
    return sub
  }))
```

### Subtitle object example

``` js
{
  id: 1,
  startTime: {
    hours: 0,
    minutes: 0,
    seconds: 5,
    ms: 532
  },
  startTime: {
    hours: 0,
    minutes: 0,
    seconds: 9,
    ms: 234
  },
  body: ['first line', 'second line']
}
```

## License

MIT. Copyright (c) Krešimir Klas
