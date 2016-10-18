import Ember from 'ember';
import BaseFormObject from 'ember-form-object/forms/base-form';
import ModelFormObject from 'ember-form-object/forms/model-form';
import FormRouteMixin from 'ember-form-object/mixins/form-route';
import FormLossPreventerService from 'ember-form-object/services/form-loss-preventer';
import { module, test } from 'qunit';
import { setOwnerWithRegistry } from '../../stubs/owner';
import { TestModel } from '../../stubs/model';

const {run} = Ember;

module('Unit | Mixin | form route', {
  beforeEach() {
    const FormRoute = Ember.Object.extend(FormRouteMixin, {
      formName: 'base'
    });

    this.route = FormRoute.create();

    this.baseFormObjectClass = BaseFormObject.extend({properties: { test: {} }});
    this.modelFormObjectClass = ModelFormObject.extend({});

    setOwnerWithRegistry(this.route, {
      'form:base': this.baseFormObjectClass,
      'form:model': this.modelFormObjectClass
    }, {
      'service:form-loss-preventer': FormLossPreventerService.extend({
        setupBeforeUnloadListener() {}
      }).create()
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

test('it should detect registered dirty form to prevent transition', function(assert) {
  const form = this.route.createForm();
  form.set('test', 'something');
  assert.equal(this.route.shouldPreventTransition(), true);
});

test('it should not detect registered dirty form to prevent transition after form is destroyed', function(assert) {
  const form = this.route.createForm();
  form.set('test', 'something');
  run(() => this.route.destroyForm());
  assert.equal(this.route.shouldPreventTransition(), false);
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
