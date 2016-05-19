import Ember from 'ember';
import BaseFormObject from 'ember-form-object/forms/base-form';
import ModelFormObject from 'ember-form-object/forms/model-form';
import FormRouteMixin from 'ember-form-object/mixins/form-route';
import { module, test } from 'qunit';
import { setOwnerWithRegistry } from '../../stubs/owner';
import { TestModel } from '../../stubs/model';

module('Unit | Mixin | form route', {
  beforeEach() {
    const FormRoute = Ember.Object.extend(FormRouteMixin, {
      formName: 'base'
    });

    this.route = FormRoute.create();

    this.baseFormObjectClass = BaseFormObject.extend({});
    this.modelFormObjectClass = ModelFormObject.extend({});

    setOwnerWithRegistry(this.route, {
      'form:base': this.baseFormObjectClass,
      'form:model': this.modelFormObjectClass
    });
  }
});

test('it can be instantiated', function(assert) {
  assert.ok(this.route);
});

test('it should create form from form name', function(assert) {
  const form = this.route.createForm();
  assert.ok(form instanceof this.baseFormObjectClass);
});

test('it should create form from form name', function(assert) {
  const form = this.route.createForm();
  assert.ok(form instanceof this.baseFormObjectClass);
  assert.equal(this.route.get('form'), form);
});

test('it should create form with model in afterModel hook', function(assert) {
  const model = new TestModel();
  this.route.formName = 'model';
  this.route.afterModel(model);
  assert.equal(this.route.get('form.model'), model);
});

test('it should destroy form on route deactivate', function(assert) {
  const form = this.route.createForm();

  Ember.run(() => {
    this.route.deactivate();
    Ember.run.scheduleOnce('destroy', () => {
      assert.ok(form.get('isDestroyed'), 'form should be destroyed');
      assert.ok(!this.route.get('form'), 'form should be nullified');
    });
  });
});
