import Ember from 'ember';
import DS from 'ember-data';

function isEmberPromise(obj) {
  return obj instanceof DS.PromiseObject ||
    obj instanceof DS.PromiseArray ||
    obj instanceof DS.PromiseManyArray ||
    obj instanceof Ember.RSVP.Promise;
}

function isThenable(obj) {
  return obj && typeof obj.then === 'function';
}

function isAlive(obj) {
  return obj && !obj.isDestroyed && !obj.isDestroying;
}

function runSafe(unsafeObject, clb, clbContext, fallbackReturnValue) {
  return function() {
    if (isAlive(unsafeObject)) {
      return clb.apply(clbContext || this, arguments);
    }
    return fallbackReturnValue;
  };
}

function depromisifyObject(obj) {
  if (isEmberPromise(obj) && 'content' in obj) {
    return obj.get('content');
  }
  return obj;
}

function depromisifyProperty(prop) {
  return prop && prop.toArray ? prop.toArray().map(depromisifyObject) : depromisifyObject(prop);
}

function normalizeValueForDirtyComparison(val, isArray) {
  let normalizedVal = depromisifyProperty(val);

  if (!normalizedVal && isArray) {
    normalizedVal = [];
  } else if (normalizedVal === null) {
    normalizedVal = undefined;
  }

  return normalizedVal;
}

export {
  isAlive,
  runSafe,
  isEmberPromise,
  isThenable,
  depromisifyObject,
  depromisifyProperty,
  normalizeValueForDirtyComparison
};
