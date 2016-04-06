import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';

export default Ember.Route.extend(FormRouteMixin, {
  formName: 'todo',

  model(params) {
    return this.store.peekRecord('todo', params.id);
  },

  afterModel() {
    this._super(...arguments);
    this.set('form.people', this.store.peekAll('user'));
  },

  actions: {
    saveModelForm() {
      this.get('form').save();
    }
  }
});
