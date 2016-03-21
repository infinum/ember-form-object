import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';

export default Ember.Route.extend(FormRouteMixin, {
  model() {
    return this.store.createRecord('todo', {});
  }
});
