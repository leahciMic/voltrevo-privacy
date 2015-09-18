'use strict';

var assert = require('assert');

module.exports = function() {
  var privacy = {};

  var tags = { in: {}, out: {} };

  privacy.wrap = function(asset) {
    return {
      _unwrap: function(tag) {
        assert(tag === tags.in);

        return {
          tag: tags.out,
          asset: asset
        };
      }
    };
  };

  privacy.unwrap = function(wrappedAsset) {
    var unwrapped = wrappedAsset._unwrap(tags.in);
    assert(unwrapped.tag === tags.out);

    return unwrapped.asset;
  };

  return privacy;
};
