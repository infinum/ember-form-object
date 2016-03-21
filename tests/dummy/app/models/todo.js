import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  description: DS.attr('string'),
  completed: DS.attr('boolean'),

  assignee: DS.belongsTo('user'),
  subscribers: DS.hasMany('user'),

  save() {
    return new Ember.RSVP.Promise(resolve => setTimeout(() => resolve(), 1000));
  }
});
