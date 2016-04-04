/* eslint no-alert: 0 */
import Ember from 'ember';
import { createFormObject } from 'ember-form-object/utils/core';

export default Ember.Mixin.create({
  _formLossWasConfirmed: false,
  preventFormLoss: true,
  formLossConfirmationMessage: 'Are you sure?',

  afterModel() {
    const model = this.modelFor(this.routeName);
    this.createForm(FormClass, model, this.formExtraProps ? this.formExtraProps(model) : null);
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('modelForm', this.get('modelForm'));
  },

  resetController() {
    const model = this.get('controller.modelForm.model');
    if (model && !model.get('isDeleted') && model.get('isNew')) {
      this.get('controller.modelForm').rollbackAttributes();
    }
  },

  confirmTransition() {
    return new Ember.RSVP.Promise((resolve, reject) => {
      if (window.confirm(this.get('formLossConfirmationMessage'))) {
        resolve();
      } else {
        reject();
      }
    });
  },

  createForm(model, extraProps) {
    const owner = Ember.getOwner(this);
    const FormClass = this.get('formClass') || owner.resolveRegistration(`form:${this.get('formName')}`);

    Ember.assert('Form class could not be resolved. Maybe invalid formName param?', !Ember.isEmpty(FormClass));

    const modelForm = window.form = createFormObject(this, FormClass, model, extraProps);
    this.set('modelForm', modelForm);
    return modelForm;
  },

  deactivate() {
    this._super(...arguments);
    if (this.get('modelForm')) {
      this.get('modelForm').destroy();
      this.set('modelForm', null);
    }
  },

  actions: {
    willTransition(transition) {
      const modelForm = this.get('controller.modelForm');

      Ember.assert('"modelForm" has to be set on controller when using FormRouteMixin', !Ember.isEmpty(modelForm));

      if (this.get('preventFormLoss') && modelForm.get('isDirty') && !this._formLossWasConfirmed) {
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
