import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    selectOption(optionId) {
      this.set('value', this.get('options').findBy('id', optionId));
    }
  }
});
