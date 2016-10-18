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
  this.route.createAndSetupMainForm();
  const form = this.route.get('form');
  assert.ok(form instanceof this.baseFormObjectClass);
});

test('it should create form from form name', function(assert) {
  this.route.createAndSetupMainForm();
  const form = this.route.get('form');
  assert.ok(form instanceof this.baseFormObjectClass);
  assert.equal(this.route.get('form'), form);
});

test('it should detect registered dirty form to prevent transition', function(assert) {
  this.route.createAndSetupMainForm();
  const form = this.route.get('form');
  form.set('test', 'something');
  assert.equal(this.route.shouldPreventTransition(), true);
});

test('it should not detect registered dirty form to prevent transition after form is destroyed', function(assert) {
  this.route.createAndSetupMainForm();
  const form = this.route.get('form');
  form.set('test', 'something');
  run(() => this.route.destroyForm(form));
  assert.equal(this.route.shouldPreventTransition(), false);
});

test('it should create form with model in afterModel hook', function(assert) {
  const model = new TestModel();
  this.route.formName = 'model';
  this.route.afterModel(model);
  assert.equal(this.route.get('form.model'), model);
});

test('it should not create form automatically if formName not set', function(assert) {
  const model = new TestModel();
  this.route.formName = null;
  this.route.afterModel(model);
  assert.equal(this.route.get('form'), undefined);
});

test('it should destroy form on route deactivate', function(assert) {
  this.route.createAndSetupMainForm();
  const form = this.route.get('form');

  Ember.run(() => {
    this.route.deactivate();
    Ember.run.scheduleOnce('destroy', () => {
      assert.ok(form.get('isDestroyed'), 'form should be destroyed');
      assert.ok(!this.route.get('form'), 'form should be nullified');
    });
  });
});

test('it should create and destroy multiple forms', function(assert) {
  this.route.formName = null;
  const form1 = this.route.createForm('base');
  const form2 = this.route.createForm('base');

  assert.equal(form1.get('isDestroyed'), false);
  assert.equal(form2.get('isDestroyed'), false);

  Ember.run(() => {
    this.route.deactivate();
    Ember.run.scheduleOnce('destroy', () => {
      assert.ok(form1.get('isDestroyed'), 'form should be destroyed');
      assert.ok(form2.get('isDestroyed'), 'form should be destroyed');
    });
  });
});
