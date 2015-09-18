'use strict';

var nothing = {};

module.exports = function() {
  var privacy = {};

  var currAsset = nothing;
  var wrappedAssetStack = [];

  var currWrappedAsset = function() {
    return wrappedAssetStack[wrappedAssetStack.length - 1];
  };

  privacy.wrap = function(asset) {
    var wrappedAsset = function() {
      if (currWrappedAsset() !== wrappedAsset) {
        throw new Error('Tried to unwrap an invalid wrapped asset.');
      }

      currAsset = asset;
    };

    return wrappedAsset;
  };

  privacy.unwrap = function(wrappedAsset) {
    wrappedAssetStack.push(wrappedAsset);

    try {
      wrappedAsset();
    } finally {
      wrappedAssetStack.pop();
    }

    var asset = currAsset;
    currAsset = nothing;

    if (asset === nothing) {
      throw new Error('Tried to unwrap an invalid wrapped asset.');
    }

    return asset;
  };

  return privacy;
};
