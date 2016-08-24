import Ember from 'ember';
import DS from 'ember-data';

const { keys: objectKeys } = Object;
const { copy } = Ember;

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

function isFunction(x) {
  return typeof x === 'function';
}

function isPlainObject(x) {
  return typeof x === 'object' && x !== null && !x.prototype;
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

function some(obj, clb) {
  const keys = objectKeys(obj);

  for (let i = 0; i < keys.length; i += 1) {
    if (clb(obj[keys[i]])) {
      return true;
    }
  }

  return false;
}

function every(obj, clb) {
  const keys = objectKeys(obj);

  for (let i = 0; i < keys.length; i += 1) {
    if (!clb(obj[keys[i]])) {
      return false;
    }
  }

  return true;
}

function forOwn(obj, clb) {
  const keys = objectKeys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    clb(obj[keys[i]], keys[i], obj);
  }
}

function result(obj, key) {
  if (isFunction(obj[key])) {
    return obj[key]();
  }
  return obj[key];
}

function cloneDeep(x) {
  return copy(x, true);
}

export {
  isAlive,
  isEmberPromise,
  isThenable,
  isFunction,
  isPlainObject,
  runSafe,
  depromisifyObject,
  depromisifyProperty,
  forOwn,
  some,
  every,
  result,
  cloneDeep
};
