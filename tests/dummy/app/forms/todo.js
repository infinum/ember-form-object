import Ember from 'ember';
import ModelFormObject from 'ember-form-object/forms/model-form';

export default ModelFormObject.extend({
  properties: {
    'title': { validate: { presence: true } },
    'completed': {},
    'assignee': {},
    'subscribers': { async: true },

    'description': { virtual: true, validate: { presence: true } },
    'people': { virtual: true, async: true }
  },

  setDescription() {
    return this.get('model.description');
  },

  syncDescription() {
    const parsedDescription = Ember.String.capitalize(this.get('description').trim());
    this.set('model.description', parsedDescription);
  },

  beforeSubmit() {
    this._super(...arguments);
  },

  afterSubmit() {
    this._super(...arguments);
    this.set('description', this.setDescription());
  }
});
