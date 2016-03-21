import Ember from 'ember';
import loadMockData from '../utils/load-mock-data';

export default Ember.Route.extend({
  beforeModel() {
    loadMockData(this.store);
  },

  model() {
    return this.store.peekAll('todo');
  },

  setupController(controller, model) {
    controller.set('todos', model);
  }
});
