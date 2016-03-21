import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'input',
  type: 'checkbox',
  attributeBindings: [
    'checked',
    'disabled',
    'name',
    'required',
    'type',
    'value'
  ],
  name: Ember.computed.alias('propertyName'),
  checked: Ember.computed('value', 'property', function() {
    return !!this.get('property');
  }),
  change() {
    this.set('value', this.$().prop('checked'));
  }
});
