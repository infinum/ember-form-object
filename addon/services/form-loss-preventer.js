import Ember from 'ember';
import {some} from 'ember-form-object/utils/core';

const {Service, computed, $, A: emberArray} = Ember;

export default Service.extend({
  registeredFormObjects: computed(() => emberArray()),

  init() {
    this._super(...arguments);
    this.setupBeforeUnloadListener();
  },

  setupBeforeUnloadListener() {
    $(window).on('beforeunload', (ev) => this.onWindowBeforeUnload(ev));
  },

  registerFormObject(formObject) {
    this.set('registeredFormObjects', this.get('registeredFormObjects').concat(formObject));
  },

  unregisterFormObject(formObject) {
    this.set('registeredFormObjects', this.get('registeredFormObjects').without(formObject));
  },

  hasSomeDirtyForms() {
    return some(this.get('registeredFormObjects'), (formObject) => formObject.get('isDirty'));
  },

  onWindowBeforeUnload() {
    if (this.hasSomeDirtyForms()) {
      return 'You have attempted to leave this page. There are some changes that need to be saved.';
    }
  }
});
