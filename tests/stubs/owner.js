import Ember from 'ember';

const hasGetOwner = !!Ember.getOwner;

function setOwnerPolyfill(object, owner) {
  if (hasGetOwner) {
    return Ember.setOwner(object, owner);
  }

  object.container = {
    lookup: owner.lookup,
    resolveRegistration: owner.resolveRegistration,
    registry: owner,
    _registry: owner
  };

  return object;
}

function setOwnerWithRegistry(object, registryResolveMap, lookupResolveMap) {
  setOwnerPolyfill(object, {
    lookup: (moduleId) => lookupResolveMap[moduleId],
    resolveRegistration: (moduleId) => registryResolveMap[moduleId],
    resolve: (moduleId) => registryResolveMap[moduleId]
  });
}

export {
  setOwnerWithRegistry
};
