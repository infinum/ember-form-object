import Ember from 'ember';
import DS from 'ember-data';

function createFormObject(hostObject, FormClass, arg1, arg2) {
  return new FormClass(hostObject.get('container'), arg1, arg2);
}

function isEmberPromise(obj) {
  return obj instanceof DS.PromiseObject ||
    obj instanceof DS.PromiseArray ||
    obj instanceof DS.PromiseManyArray ||
    obj instanceof Ember.RSVP.Promise;
}

function isThenable(obj) {
  return obj && typeof obj.then === 'function';
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

export {
  createFormObject,
  isEmberPromise,
  isThenable,
  depromisifyObject,
  depromisifyProperty
};
