import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';
import TodoForm from '../../forms/todo';

export default Ember.Route.extend(FormRouteMixin, {
  formClass: TodoForm,

  model(params) {
    return this.store.peekRecord('todo', params.id);
  },

  afterModel() {
    this._super(...arguments);
    this.set('modelForm.people', this.store.peekAll('user'));
  },

  actions: {
    saveModelForm() {
      this.get('modelForm').save();
    }
  }
});
