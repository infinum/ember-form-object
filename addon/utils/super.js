import Ember from 'ember';

const { assert } = Ember;
const superCallFlags = {};

function ensureSuperWasCalled(form, key) {
  assert(`ember-form-object: You have to call this._super(...arguments) in "${key}" method`, superCallFlags[key]);
  superCallFlags[key] = false;
}

function superWasCalled(form, key) {
  superCallFlags[key] = true;
}

export {
  ensureSuperWasCalled,
  superWasCalled
};
