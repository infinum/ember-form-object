import Ember from 'ember';
import getOwner from 'ember-getowner-polyfill';

export default function createForm(formNameOrClass, hostObject, arg1, arg2) {
  const owner = getOwner(hostObject);
  let FormClass = formNameOrClass;

  if (typeof formNameOrClass === 'string') {
    FormClass = owner.resolveRegistration(`form:${formNameOrClass}`);
    Ember.assert('Form class could not be resolved. Maybe invalid formName param?', !Ember.isEmpty(FormClass));
  }

  return new FormClass(owner, arg1, arg2);
}
