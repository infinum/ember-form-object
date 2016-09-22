/* eslint no-alert: 0 */
import Ember from 'ember';
import createForm from 'ember-form-object/utils/create-form';

export default Ember.Mixin.create({
  _formLossWasConfirmed: false,
  preventFormLoss: true,
  formLossConfirmationMessage: 'Are you sure?',

  afterModel(model) {
    this._super(...arguments);
    this.destroyForm();
    this.createForm(model, this.formExtraProps ? this.formExtraProps(model) : null);
    this.assignFormToController(this.controller, this.form);
  },

  setupController(controller) {
    this._super(...arguments);
    this.assignFormToController(controller, this.form);
  },

  resetController() {
    const model = this.get('controller.form.model');
    if (model && !model.get('isDeleted') && model.get('isNew')) {
      this.get('controller.form').rollbackModelAttributes();
    }
  },

  confirmTransition() {
    return new Ember.RSVP.Promise((resolve, reject) => {
      return window.confirm(this.get('formLossConfirmationMessage')) ? resolve() : reject();
    });
  },

  assignFormToController(controller, form) {
    if (controller) {
      controller.set('form', form);
    }
  },

  createForm(model, extraProps) {
    const formName = this.get('formName');
    const args = [formName, this].concat(model ? [model, extraProps] : [extraProps]);
    const form = createForm(...args);
    this.set('form', form);
    return form;
  },

  deactivate() {
    this._super(...arguments);
    this.destroyForm();
  },

  destroyForm() {
    if (this.get('form')) {
      this.get('form').destroy();
      this.set('form', null);
    }
  },

  actions: {
    willTransition(transition) {
      const form = this.get('controller.form');

      Ember.assert('"form" has to be set on controller when using FormRouteMixin', !Ember.isEmpty(form));

      if (this.get('preventFormLoss') && form.get('isDirty') && !this._formLossWasConfirmed) {
        transition.abort();
        this.confirmTransition().then(() => {
          this._formLossWasConfirmed = true;
          transition.retry();
        });
      } else {
        this._formLossWasConfirmed = false;
      }
    }
  }
});
