import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import ModelFormObject from 'ember-form-object/forms/model-form';
import { createForm } from 'ember-form-object/utils/core';
import { modelFormObjectClassProps } from '../../stubs/form';
import { TestModel } from '../../stubs/model';

moduleFor('form:model-form', 'Unit | Forms | model form', {
  unit: true,
  needs: [
    'service:validations',
    'ember-validations@validator:local/presence',
    'validator:is-valid-on-server'
  ],
  beforeEach() {
    const model = this.model = new TestModel();
    model.setProperties({ modelProp1: '1', modelProp2: '2', modelProp3: '3' });

    const FormObjectClass = ModelFormObject.extend(modelFormObjectClassProps);
    this.form = createForm(FormObjectClass, this, model, { extraProp: 'extra' });
  },
  afterEach() {
    Ember.run(() => {
      this.form.destroy();
      this.model.destroy();
    });
  }
});

test('it should be instantiable with model', function(assert) {
  assert.ok(this.form);
});

test('it reads defined properties from model', function(assert) {
  assert.equal(this.form.get('modelProp1'), '1');
  assert.equal(this.form.get('modelProp2'), '2');
  assert.equal(this.form.get('modelProp3'), void 0);
});

test('it stops reading from model when property is overwritten', function(assert) {
  this.form.set('modelProp1', 'test');
  assert.equal(this.model.get('modelProp1'), '1');
  assert.equal(this.form.get('modelProp1'), 'test');
});

test('it validates model & virtual properties', function(assert) {
  this.form.set('modelProp1', '');
  this.form.set('virtualProp1', '');

  return this.form.save().then(() => {
    assert.ok(false, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('errors.modelProp1.length'), 1);
    assert.equal(this.form.get('errors.virtualProp1.length'), 1);
  });
});

test('it syncs properties with model unless property is dirty', function(assert) {
  this.model.set('modelProp1', 'new 1');
  assert.equal(this.form.get('modelProp1'), 'new 1');

  this.form.set('modelProp1', 'new form 1');
  this.model.set('modelProp1', '1');
  assert.equal(this.form.get('modelProp1'), 'new form 1');
  assert.equal(this.model.get('modelProp1'), '1');
});

test('it sets computed properties to model before submitting', function(assert) {
  this.form.set('virtualProp1', 'virtual');
  this.form.submit = () => {
    assert.equal(this.model.get('modelProp3'), 'virtual');
    return Ember.RSVP.resolve(this.form);
  };
  return this.form.save().catch(() => {
    assert.ok(false, 'Should not have been rejected');
  });
});

test('it should enable adding model properties dynamically', function(assert) {
  this.form.addProperties({
    modelProp4: {}
  });
  assert.equal(this.form.get('modelProp4'), '4');
});

test('it should enable removing properties dynamically', function(assert) {
  this.form.addProperties({ modelProp4: {} });
  this.form.removeProperties(['modelProp4', 'modelProp1', 'modelProp2']);
  assert.equal(this.form.get('modelProp4'), void 0);
  assert.equal(this.form.get('modelProp1'), void 0);
  assert.equal(this.form.get('modelProp2'), void 0);
  assert.equal('modelProp4' in this.form.get('properties'), false);
});

test('it should handle server validation errors', function(assert) {
  this.model.save = () => {
    this.model.set('errors', { content: [
      { attribute: 'modelProp1', message: 'Server error on prop 1' },
      { attribute: 'modelProp2', message: 'Server error on prop 2' }
    ] });
    return Ember.RSVP.reject('422 Unprocessible entity');
  };

  this.form.set('modelProp1', 'val 1');
  this.form.set('modelProp2', 'val 2');
  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.ok(false, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('errors.modelProp1.length'), 1);
    assert.equal(this.form.get('errors.modelProp2.length'), 1);
    assert.equal(this.form.get('errors.modelProp1').objectAt(0), 'Server error on prop 1');
    assert.equal(this.form.get('errors.modelProp2').objectAt(0), 'Server error on prop 2');
  });
});

test('it should rollback model attributes on server validation errors', function(assert) {
  assert.expect(1);

  this.model.save = () => {
    this.model.set('errors', { content: [{ attribute: 'modelProp1', message: 'Server error on prop 1' }] });
    return Ember.RSVP.reject('422 Unprocessible entity');
  };

  this.model.rollbackAttributes = () => {
    assert.ok(true, 'Model.rollbackAttributes should have beeen called');
  };

  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.ok(false, 'Save should not have been resolved');
  }).catch(Ember.K);
});

test('it should handle server validation errors for attributes not in form properties', function(assert) {
  this.model.save = () => {
    this.model.set('errors', { content: [{ attribute: 'otherProp', message: 'Other error' }] });
    return Ember.RSVP.reject('422 Unprocessible entity');
  };

  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.ok(false, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('otherServerErrors.length'), 1);
    assert.equal(this.form.get('otherServerErrors').objectAt(0).propertyName, 'otherProp');
    assert.equal(this.form.get('otherServerErrors').objectAt(0).message, 'Other error');
  });
});
