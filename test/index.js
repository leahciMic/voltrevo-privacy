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

  it('can wrap many different things, and the unwrap order doesn\'t matter', function() {
    var privacy = Privacy();

    var thingsToWrap = [
      SECRET,
      [],
      {},
      'foobar',
      undefined,
      37,
      null,
      global,
      thingsToWrap,
      [thingsToWrap],
      privacy,
      Privacy,
      function() {}
    ];

    var wrappedThings = thingsToWrap.map(privacy.wrap);

    [7, 1, 7, 6, 8, 12, 3, 2, 9, 1, 0, 10, 10, 11, 4, 4, 4, 5].forEach(function(i) {
      assert(privacy.unwrap(wrappedThings[i]) === thingsToWrap[i]);
    });
  });

  it('wrapped objects are functions that we can\'t call without throwing', function() {
    var wrapped = Privacy().wrap(SECRET);

    assert(typeof wrapped === 'function');

    [
      [],              // No args
      [undefined],     // Single arg but undefined
      [{}],            // Looks just like the tag used in the privacy module
      ['open sesame'], // Just for fun
      [1, 2, 3, 4, 5], // Lots of args
      [Privacy],       // This would be weird
      [Privacy()],     // So would this
      [wrapped]        // And this
    ].forEach(function(fakeKeys) {
      assert(checkThrow(function() {
        var output = wrapped.apply(undefined, fakeKeys);
        assert(output !== SECRET); // Shouldn't reach here anyway
      }));
    });
  });

  it('unwrap throws when we try to pass it a fake wrapped object', function() {
    assert(checkThrow(function() {
      Privacy().unwrap(function() {});
    }));
  });

  it('isn\'t broken by spying on ._unwrap', function() {
    // This was a real exploit in the original design:
    // https://github.com/voltrevo/voltrevo-privacy/blob/263bbb1153/lib/index.js

    assert(checkThrow(function() {
      var privacy = Privacy();

      var inTag = undefined;
      var outTag = undefined;

      var legitWrapped = privacy.wrap({});

      var actualUnwrap = legitWrapped._unwrap;

      legitWrapped._unwrap = function(tag) {
        var result = actualUnwrap.apply(this, arguments);

        inTag = tag;
        outTag = result.tag;

        return result;
      };

      // Having to use the privacy instance might seem like a weakness in the exploit, but we only
      // need to wait for unwrap to be called elsewhere. Since we have the wrapped object, the whole
      // point is that we can send it to someone who can unwrap it, so getting someone to call
      // unwrap would typically be easy.
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

  it('spying on wrappedAsset causes throw', function() {
    var privacy = Privacy();

    assert(checkThrow(function() {
      var wrappedAsset = privacy.wrap(SECRET);

      var spy = function() {
        return wrappedAsset.apply(this, arguments);
      };

      privacy.unwrap(spy);
    }));
  });

  it('bad unwrap calls do not prevent subsequent wraps from working', function() {
    var privacy = Privacy();

    assert(checkThrow(function() {
      privacy.unwrap(function() {});
    }));

    assert(privacy.unwrap(privacy.wrap(SECRET)) === SECRET);
  });

  it('using the privacy instance inside a bad unwrap call works', function() {
    var privacy = Privacy();

    var w1 = privacy.wrap(SECRET);

    var completedChecks = false;

    assert(checkThrow(function() {
      privacy.unwrap(function() {
        var self = this;
        var spyArgs = arguments;
        var spyResult = undefined;

        assert(privacy.unwrap(w1) === SECRET);
        assert(privacy.unwrap(privacy.wrap('foobar')) === 'foobar');

        assert(checkThrow(function() {
          spyResult = w1.apply(self, spyArgs);
        }));

        assert(privacy.unwrap(privacy.wrap(123)) === 123);

        completedChecks = true;

        return spyResult;
      });
    }));

    assert(completedChecks);
  });
});
