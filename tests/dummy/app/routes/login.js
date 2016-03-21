import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';
import LoginForm from '../forms/login';

export default Ember.Route.extend(FormRouteMixin, {
  formClass: LoginForm
});
