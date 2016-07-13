import Ember from 'ember';
import DS from 'ember-data';
import getOwner from 'ember-getowner-polyfill';

function createForm(formNameOrClass, hostObject, arg1, arg2) {
  const owner = getOwner(hostObject);
  let FormClass = formNameOrClass;

  if (typeof formNameOrClass === 'string') {
    FormClass = owner.resolveRegistration(`form:${formNameOrClass}`);
    Ember.assert('Form class could not be resolved. Maybe invalid formName param?', !Ember.isEmpty(FormClass));
  }

  return new FormClass(owner, arg1, arg2);
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

function isAlive(obj) {
  return obj && !obj.isDestroyed && !obj.isDestroying;
}

function runSafe(unsafeObject, clb, clbContext) {
  return function() {
    if (isAlive(unsafeObject)) {
      return clb.apply(clbContext || this, arguments);
    }

    return Ember.Logger.debug('Prevented callback that depended on destroyed object');
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

function getEmberValidationsContainerPolyfill(owner) {
  return {
    lookup: module => owner.lookup(module),
    lookupFactory: module => owner._lookupFactory ? owner._lookupFactory(module) : owner.lookupFactory(module)
  };
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
  createForm,
  isEmberPromise,
  isThenable,
  depromisifyObject,
  depromisifyProperty,
  getEmberValidationsContainerPolyfill,
  normalizeValueForDirtyComparison
};
