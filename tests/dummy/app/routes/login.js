import Ember from 'ember';
import FormRouteMixin from 'ember-form-object/mixins/form-route';

export default Ember.Route.extend(FormRouteMixin, {
  formName: 'login',

  actions: {
    save() {
      window.alert(`Will save: ${this.get('form.email')} - ${this.get('form.password')}`);
      this.get('form').save().then(res => {
        window.alert(`Result: ${res}`);
      });
    }
  }
});
