import Ember from 'ember';
import BaseForm from 'ember-form-object/forms/base-form';

export default BaseForm.extend({
  properties: {
    'email': {
      value: '',
      validate: { presence: true }
    },
    'password': {
      value: '',
      validate: { presence: true }
    },
    'rememberMe': {
      value: false
    }
  },

  submit() {
    const credentials = this.getProperties('email', 'password');
    return new Ember.RSVP.Promise((resolve) => setTimeout(() => resolve(credentials), 1000));
  }
});
