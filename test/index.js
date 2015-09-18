'use strict';

/* global describe it */

var assert = require('assert');

var range = require('range').range;

var Privacy = require('../lib');

var SECRET = {};

var checkThrow = function(fn) {
  var exception = undefined;

  try {
    fn();
  } catch (e) {
    exception = e;
  }

  return exception !== undefined;
};

describe('voltrevo-privacy', function() {
  it('can wrap and unwrap', function() {
    var privacy = Privacy();

    assert(privacy.unwrap(privacy.wrap(SECRET)) === SECRET);
  });

  it('can wrap and unwrap many times', function() {
    var privacy = Privacy();

    for (var i = 2; i <= 100; i++) {
      var curr = SECRET;

      range(i).forEach(function() {
        curr = privacy.wrap(curr);
      });

      assert(curr !== SECRET);

      range(i).forEach(function() {
        curr = privacy.unwrap(curr);
      });

      assert(curr === SECRET);
    }
  });

  it('a privacy instance cannot unwrap a secret from another instance', function() {
    var privacyA = Privacy();
    var privacyB = Privacy();

    var wrappedByA = privacyA.wrap(SECRET);

    assert(checkThrow(function() {
      var output = privacyB.unwrap(wrappedByA);
      assert(output !== SECRET); // Shouldn't reach here anyway
    }));
  });

  it('can apply wraps from many instances, and unwrap them again', function() {
    var privacies = range(100).map(function() {
      return Privacy();
    });

    var curr = SECRET;

    privacies.forEach(function(p) {
      curr = p.wrap(curr);
    });

    assert(curr !== SECRET);

    privacies.slice().reverse().forEach(function(p) {
      curr = p.unwrap(curr);
    });

    assert(curr === SECRET);
  });

  it('wrapped objects have a ._unwrap that we can\'t call without throwing', function() {
    var _unwrap = Privacy().wrap(SECRET);

    [
      [],              // No args
      [undefined],     // Single arg but undefined
      [{}],            // Looks just like the tag used in the privacy module
      ['open sesame'], // Just for fun
      [1, 2, 3, 4, 5], // Lots of args
      [Privacy],       // This would be weird
      [Privacy()],     // So would this
      [_unwrap]        // And this
    ].forEach(function(fakeKeys) {
      assert(checkThrow(function() {
        var output = _unwrap.apply(undefined, fakeKeys);
        assert(output !== SECRET); // Shouldn't reach here anyway
      }));
    });
  });

  it('unwrap throws when we try to pass it a fake wrapped object', function() {
    assert(checkThrow(function() {
      Privacy().unwrap({
        _unwrap: function(tag) {
          assert(tag !== undefined);

          return {
            tag: {},
            asset: 'foo'
          };
        }
      });
    }));
  });

  it('isn\'t broken by spying on ._unwrap', function() {
    assert(checkThrow(function() {
      var privacy = Privacy();

      var inTag = undefined;
      var outTag = undefined;

      var legitWrapped = privacy.wrap({});

      var actualUnwrap = legitWrapped._unwrap;

      legitWrapped._unwrap = function(tag) {
        inTag = tag;
        var result = actualUnwrap.apply(this, arguments);
        outTag = result.tag;
        return result;
      };

      privacy.unwrap(legitWrapped);

      // If this exploit works, ._unwrap doesn't throw here
      privacy.wrap({})._unwrap(inTag);

      // And we can make a fake wrapped object to unwrap too, also doesn't throw
      privacy.unwrap({
        _unwrap: function() {
          return {
            tag: outTag,
            asset: 'oops'
          };
        }
      });
    }));
  });
});
