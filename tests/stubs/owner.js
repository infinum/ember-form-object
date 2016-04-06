import Ember from 'ember';

function setOwnerWithRegistry(object, registryResolveMap, lookupResolveMap) {
  Ember.setOwner(object, {
    lookup(moduleId) {
      return lookupResolveMap[moduleId];
    },
    resolveRegistration(moduleId) {
      return registryResolveMap[moduleId];
    }
  });
}

export {
  setOwnerWithRegistry
};
