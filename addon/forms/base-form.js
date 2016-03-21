import Ember from 'ember';
import EmberValidations from 'ember-validations';
import FormObjectMixin from 'ember-form-object/mixins/form-object';

export default Ember.Object.extend(EmberValidations, FormObjectMixin);
