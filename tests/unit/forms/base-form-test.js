import _ from 'lodash';
import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import BaseFormObject from 'ember-form-object/forms/base-form';
import createForm from 'ember-form-object/utils/create-form';
import { baseFormObjectClassProps } from '../../stubs/form';

function overrideWithSuper(form, methodName, method) {
  const oldMethod = form[methodName];
  form[methodName] = function() {
    oldMethod.apply(form, arguments);
    method.apply(form);
  };
}

moduleFor('form:base-form', 'Unit | Forms | base form', {
  unit: true,
  needs: [
    'service:validations',
    'ember-validations@validator:local/presence'
  ],
  beforeEach() {
    const FormObjectClass = BaseFormObject.extend(baseFormObjectClassProps);
    this.form = createForm(FormObjectClass, this, { extraProp: 'extra' });
  },
  afterEach() {
    Ember.run(() => this.form.destroy());
  }
});

test('it exists', function(assert) {
  assert.ok(BaseFormObject);
  assert.ok(this.form);
});

test('it assigns virtual & extra properties', function(assert) {
  assert.equal(this.form.get('test'), '');
  assert.equal(this.form.get('test2'), 'pero');
  assert.equal(this.form.get('extraProp'), 'extra');
});

test('it shouldn\'t be dirty after creation', function(assert) {
  assert.equal(this.form.get('isDirty'), false);
});

test('it shouldn\'t be dirty after changing custom property', function(assert) {
  this.form.set('newProp', 'something');
  assert.equal(this.form.get('isDirty'), false);
});

test('it should become dirty after changing property from the config', function(assert) {
  const initialValue = this.form.get('test');
  this.form.set('test', 'test');
  assert.equal(this.form.get('isDirty'), true);
  assert.equal(this.form.get('properties.test.state.isDirty'), true);
  assert.equal(this.form.get('properties.test2.state.isDirty'), false);
  this.form.set('test', initialValue);
  assert.equal(this.form.get('isDirty'), false);
  assert.equal(this.form.get('properties.test.state.isDirty'), false);
});

test('it should not start validations on save unless is dirty', function(assert) {
  this.form.validate = function() {
    assert.notOk(true, 'form.validate() should not have been called');
  };
  return this.form.save().then(() => {
    assert.notOk(true, 'form.save() should not have been resolved');
  }).catch(() => {
    assert.ok(true);
  });
});

test('it should be in "isSaveError" state if save fails', function(assert) {
  this.form.submit = function() {
    assert.notOk(true, 'submit should not have been called');
  };

  this.form.set('test2', '');

  return this.form.save().then(() => {
    assert.notOk(true, 'save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('isSaveError'), true);
  });
});

test('it should reset "isSaveError" state after save', function(assert) {
  this.form.submit = function() {
    return Ember.RSVP.resolve();
  };

  this.form.set('test', 'pero');
  this.form.set('isSaveError', true);

  return this.form.save().then(() => {
    assert.equal(this.form.get('isSaveError'), false);
  }).catch(() => {
    assert.notOk(true, 'save should have been resolved');
  });
});

test('it should not call submit on save unless validation passes', function(assert) {
  this.form.submit = function() {
    assert.notOk(true, 'submit should not have been called');
  };

  const oldValidate = this.form.validate;
  this.form.validate = () => {
    assert.ok(true, 'validate should have been called');
    return oldValidate.apply(this.form, arguments);
  };

  this.form.set('test2', '');

  return this.form.save().then(() => {
    assert.notOk(true, 'save should not have been resolved');
  }).catch(() => {
    assert.ok(true);
  });
});

test('it should call submit (and hooks) if validation passes', function(assert) {
  let i = 0;
  overrideWithSuper(this.form, 'beforeSubmit', function() {
    assert.equal(i += 1, 1);
    return Ember.RSVP.resolve();
  });

  this.form.submit = function() {
    assert.equal(i += 1, 2);
    return Ember.RSVP.resolve();
  };

  overrideWithSuper(this.form, 'afterSubmit', function() {
    this._super(...arguments);
    assert.equal(i += 1, 3);
    return Ember.RSVP.resolve();
  });

  this.form.set('test', 'test');
  return this.form.save();
});

test('it should be in submitting state while running through submit hooks', function(assert) {
  assert.expect(5);

  this.form.set('test', 'test');
  assert.equal(this.form.get('isSubmitting'), false);

  overrideWithSuper(this.form, 'beforeSubmit', () => assert.equal(this.form.get('isSubmitting'), true));

  this.form.submit = () => {
    assert.equal(this.form.get('isSubmitting'), true);
    return Ember.RSVP.resolve();
  };

  overrideWithSuper(this.form, 'beforeSubmit', () => assert.equal(this.form.get('isSubmitting'), true));

  return this.form.save().then(() => {
    assert.equal(this.form.get('isSubmitting'), false);
  });
});

test('it should be in loaded state if has no async properties', function(assert) {
  const newFormClassProps = _.cloneDeep(baseFormObjectClassProps);
  delete newFormClassProps.properties.test3.async;
  const NewForm = BaseFormObject.extend(newFormClassProps);
  this.form = createForm(NewForm, this);
  assert.equal(this.form.get('isLoaded'), true);
});

test('it shouldn\'t be in loaded state if has async properties', function(assert) {
  assert.equal(this.form.get('isLoaded'), false);
});

test('it should be in loaded state after async properties resolve', function(assert) {
  const promise = new Ember.RSVP.Promise(function(resolve) {
    resolve('some value');
  });
  this.form.set('test3', promise);
  assert.equal(this.form.get('isLoaded'), false);

  return promise.finally(() => {
    assert.equal(this.form.get('test3'), 'some value');
    assert.equal(this.form.get('properties.test3.state.isLoaded'), true);
    assert.equal(this.form.get('isLoaded'), true);
  });
});

test('it should enable adding properties dynamically', function(assert) {
  this.form.addProperties({
    newProp1: { value: 'new1' },
    newProp2: { async: true, value: () => 'new2' }
  });

  assert.equal(this.form.get('newProp1'), 'new1');
  assert.equal(this.form.get('newProp2'), 'new2');
});

test('it should validate dynamically added properties', function(assert) {
  this.form.addProperties({
    newProp1: { value: 'newprop', validate: { presence: true } }
  });
  this.form.set('newProp1', '');
  assert.equal(this.form.get('errors.newProp1.length'), 1);
});

test('it should immediately validate dynamically added properties', function(assert) {
  this.form.addProperties({
    newProp1: { value: null, validate: { presence: true } }
  });

  assert.equal(this.form.get('errors.newProp1.length'), 1);
});

test('it should return validation status of a specific property', function(assert) {
  this.form.addProperties({
    newProp1: { value: null, validate: { presence: true } },
    newProp2: { value: 'newProp2', validate: { presence: true } },
    newProp3: { value: null, validate: { presence: true } },
    newProp4: { value: 'newProp4', validate: { presence: true } },
    newProp5: { value: 'newProp5' }
  });

  this.form.set('newProp3', 'newProp3');
  this.form.set('newProp4', '');

  assert.equal(this.form.isPropertyValid('test'), false);
  assert.equal(this.form.isPropertyValid('test2'), true);
  assert.equal(this.form.isPropertyValid('newProp1'), false);
  assert.equal(this.form.isPropertyValid('newProp2'), true);
  assert.equal(this.form.isPropertyValid('newProp3'), true);
  assert.equal(this.form.isPropertyValid('newProp4'), false);
  assert.equal(this.form.isPropertyValid('newProp5'), true);
});

test('it should not be dirty after adding new properties dynamically', function(assert) {
  this.form.addProperties({
    newProp1: { value: 'new1' }
  });
  assert.equal(this.form.get('isDirty'), false);
});

test('it should be dirty after changing dynamically added properties', function(assert) {
  this.form.addProperties({
    newProp1: { value: 'new1' }
  });
  this.form.set('newProp1', 'new1updated');
  assert.equal(this.form.get('isDirty'), true);
});

test('it should enable removing properties dynamically', function(assert) {
  this.form.removeProperties(['test']);
  assert.equal(this.form.get('test'), void 0);
  assert.equal('test' in this.form.get('properties'), false);
});
