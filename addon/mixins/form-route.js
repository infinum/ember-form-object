/* eslint no-alert: 0 */
import Ember from 'ember';
import createForm from 'ember-form-object/utils/create-form';

const {Mixin, inject: { service }, RSVP: { Promise }, assert, isEmpty} = Ember;

export default Mixin.create({
  formLossPreventer: service('form-loss-preventer'),

  _formLossWasConfirmed: false,
  preventFormLoss: true,
  formLossConfirmationMessage: 'Are you sure?',

  afterModel(model) {
    this._super(...arguments);
    this.destroyForm();
    this.createForm(model, this.formExtraProps ? this.formExtraProps(model) : null);
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('form', this.get('form'));
  },

  confirmTransition() {
    return new Promise((resolve, reject) => {
      return window.confirm(this.get('formLossConfirmationMessage')) ? resolve() : reject();
    });
  },

  createForm(model, extraProps) {
    const formName = this.get('formName');
    const args = [formName, this].concat(model ? [model, extraProps] : [extraProps]);
    const form = createForm(...args);
    this.set('form', form);

    if (this.get('preventFormLoss')) {
      this.get('formLossPreventer').registerFormObject(form);
    }

    return form;
  },

  deactivate() {
    this._super(...arguments);
    this.destroyForm();
  },

  destroyForm() {
    const form = this.get('form');
    if (form) {
      if (this.get('preventFormLoss')) {
        this.get('formLossPreventer').unregisterFormObject(form);
      }
      form.destroy();
      this.set('form', null);
    }
  },

  shouldPreventTransition() {
    return this.get('preventFormLoss') && this.get('formLossPreventer').hasSomeDirtyForms() && !this._formLossWasConfirmed;
  },

  actions: {
    willTransition(transition) {
      const form = this.get('controller.form');

      assert('"form" has to be set on controller when using FormRouteMixin', !isEmpty(form));

      if (this.shouldPreventTransition()) {
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
