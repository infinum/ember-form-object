/* eslint no-alert: 0 */
import Ember from 'ember';
import createForm from 'ember-form-object/utils/create-form';

const {Mixin, inject: { service }, RSVP: { Promise }, A: emberArray} = Ember;

export default Mixin.create({
  formLossPreventer: service('form-loss-preventer'),

  _formLossWasConfirmed: false,
  _forms: null,
  preventFormLoss: true,
  formLossConfirmationMessage: 'Are you sure?',
  formName: null, // Set this to have form automatically created in afterModel and set to controller.form

  init() {
    this._super(...arguments);
    this._forms = emberArray();
  },

  afterModel(model) {
    this._super(...arguments);

    if (this.get('formName')) {
      this.createAndSetupMainForm(model);
    }
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

  createAndSetupMainForm(model) {
    this.destroyForms();
    const form = this.createForm(this.get('formName'), model, this.formExtraProps ? this.formExtraProps(model) : null);
    this.set('form', form);
  },

  createForm(formName, model, extraProps) {
    const formArgs = model ? [model, extraProps] : [extraProps];
    const form = createForm(formName, this, ...formArgs);
    this._forms.push(form);

    if (form.get('preventFormLoss')) {
      this.get('formLossPreventer').registerFormObject(form);
    }

    return form;
  },

  deactivate() {
    this._super(...arguments);
    this.destroyForms();
  },

  destroyForms() {
    this._forms.forEach((form) => this.destroyForm(form));

    if (this.get('formName')) {
      this.set('form', null);
    }
  },

  destroyForm(form) {
    this._forms = this._forms.without(form);

    if (form.get('preventFormLoss')) {
      this.get('formLossPreventer').unregisterFormObject(form);
    }

    form.destroy();
  },

  shouldPreventTransition() {
    return this.get('preventFormLoss') && this.get('formLossPreventer').hasSomeDirtyForms() && !this._formLossWasConfirmed;
  },

  actions: {
    willTransition(transition) {
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
