import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import ModelFormObject from 'ember-form-object/forms/model-form';
import createForm from 'ember-form-object/utils/create-form';
import { modelFormObjectClassProps } from '../../stubs/form';
import { TestModel } from '../../stubs/model';

const { String: { underscore }} = Ember;

function setServerValidationErrors(model, errors) {
  model.save = function() {
    model.set('errors', { content: errors, length: errors.length });

    const jsonAPIerrors = errors.map((err) => {
      return {
        status: '422',
        detail: err.message,
        source: {
          pointer: `data/attributes/${underscore(err.attribute)}`
        }
      }
    });

    return Ember.RSVP.reject({ isAdapterError: true, message: '422 Unprocessible entity', errors: jsonAPIerrors});
  };
}

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
    assert.notOk(true, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('errors.modelProp1.length'), 1);
    assert.equal(this.form.get('errors.virtualProp1.length'), 1);
  });
});

test('it syncs properties with model unless property is dirty', function(assert) {
  Ember.run(() => this.model.set('modelProp1', 'new 1'));
  assert.equal(this.form.get('modelProp1'), 'new 1');

  this.form.set('modelProp1', 'new form 1');
  Ember.run(() => this.model.set('modelProp1', '1'));
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
    assert.notOk(true, 'Should not have been rejected');
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
  setServerValidationErrors(this.model, [
    { attribute: 'modelProp1', message: 'Server error on prop 1' },
    { attribute: 'modelProp2', message: 'Server error on prop 2' }
  ]);

  this.form.set('modelProp1', 'val 1');
  this.form.set('modelProp2', 'val 2');
  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.notOk(true, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('errors.modelProp1.length'), 1);
    assert.equal(this.form.get('errors.modelProp2.length'), 1);
    assert.equal(this.form.get('errors.modelProp1').objectAt(0), 'Server error on prop 1');
    assert.equal(this.form.get('errors.modelProp2').objectAt(0), 'Server error on prop 2');
  });
});

test('it should rollback model attributes on server validation errors only on persisted models', function(assert) {
  assert.expect(1);

  this.model.set('isNew', false);
  setServerValidationErrors(this.model, [{ attribute: 'modelProp1', message: 'Server error on prop 1' }]);

  this.model.rollbackAttributes = () => {
    assert.ok(true, 'Model.rollbackAttributes should have beeen called');
  };

  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.notOk(true, 'Save should not have been resolved');
  }).catch(Ember.K);
});

test('it should handle server validation errors for attributes not in form properties', function(assert) {
  setServerValidationErrors(this.model, [{ attribute: 'otherProp', message: 'Other error' }]);

  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.notOk(true, 'Save should not have been resolved');
  }).catch(() => {
    assert.equal(this.form.get('otherServerErrors.length'), 1);
    assert.equal(this.form.get('otherServerErrors').objectAt(0).propertyName, 'otherProp');
    assert.equal(this.form.get('otherServerErrors').objectAt(0).message, 'Other error');
  });
});

test('it should function normally after server side validation errors', function(assert) {
  setServerValidationErrors(this.model, [{ attribute: 'otherProp', message: 'Other error' }]);

  this.form.set('virtualProp1', 'val 3');

  return this.form.save().then(() => {
    assert.notOk(true, 'Save should not have been resolved'); // Server validation error
  }).catch(() => {
    return this.form.save();
  }).then(() => {
    assert.notOk(true, 'Save should not have been resolved'); // Client validation error
  }).catch(() => {
    this.model.save = () => {
      assert.ok(true, 'Save should have been resolved');
      return Ember.RSVP.resolve();
    };

    this.form.set('otherProp', 'blabla');
    return this.form.save();
  });
});

test('it should detect model property conflicts', function(assert) {
  this.form.modelPropertyConflictDidOccur = () => {
    assert.notOk(true, 'modelPropertyConflictDidOccur shouldn\'t have been called if form property not dirty');
  };

  Ember.run(() => this.model.set('modelProp1', '1'));

  this.form.modelPropertyConflictDidOccur = (model, propertyName) => {
    assert.ok(true, 'modelPropertyConflictDidOccur should have been called if form property dirty');
    assert.equal(model, this.model);
    assert.equal(propertyName, 'modelProp1');
  };

  this.form.set('modelProp1', '2');
  Ember.run(() => this.model.set('modelProp1', '3'));
});

test('it should reset the form', function(assert) {
  const modelProp1initial = this.form.get('modelProp1');
  const virtualProp1initial = this.form.get('virtualProp1');
  this.form.set('modelProp1', 'modelProp1 new val');
  this.form.set('virtualProp1', 'virtualProp1 new val');
  this.form.reset();
  assert.equal(this.form.get('modelProp1'), modelProp1initial);
  assert.equal(this.form.get('virtualProp1'), virtualProp1initial);
  assert.equal(this.form.get('isDirty'), false);
});
