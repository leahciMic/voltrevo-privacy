# voltrevo-privacy [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url][![Code Climate](https://codeclimate.com/github/voltrevo/voltrevo-privacy/badges/gpa.svg)](https://codeclimate.com/github/voltrevo/voltrevo-privacy)
> Controls access to objects by securely wrapping and unwrapping them


## Install

```sh
$ npm install --save voltrevo-privacy
```


## Usage

```js
'use strict';

var Privacy = require('voltrevo-privacy');
var someOtherLib = require('some-other-lib');

var privacy = Privacy(); // Create instance.

var SECRET = {};

someOtherLib.add(
  // It is impossible for someOtherLib to get SECRET.
  privacy.wrap(SECRET)
);

someOtherLib.later(function(stuff) {
  // The only way to get SECRET back is using privacy.unwrap. Even though
  // someOtherLib clearly had stuff, and it is impossible for someOtherLib to
  // get SECRET, as long as stuff is the thing we gave someOtherLib earlier,
  // this will work:
  assert(privacy.unwrap(stuff) === SECRET);
});
```

## License

MIT © [Andrew Morris](http://andrewmorris.io/)


[npm-image]: https://badge.fury.io/js/voltrevo-privacy.svg
[npm-url]: https://npmjs.org/package/voltrevo-privacy
[travis-image]: https://travis-ci.org/voltrevo/voltrevo-privacy.svg?branch=master
[travis-url]: https://travis-ci.org/voltrevo/voltrevo-privacy
[daviddm-image]: https://david-dm.org/voltrevo/voltrevo-privacy.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/voltrevo/voltrevo-privacy
