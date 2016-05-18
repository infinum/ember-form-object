import _ from 'lodash';
import Ember from 'ember';
import DS from 'ember-data';
import EmberValidations from 'ember-validations';
import FormObjectMixin from 'ember-form-object/mixins/form-object';
import { depromisifyProperty, isThenable, runSafe } from 'ember-form-object/utils/core';

function propertyTypeReducer(type) {
  return function() {
    return _.reduce(this.get('properties'), function(arr, property, propertyName) {
      if (property[type]) {
        arr.push(propertyName);
      }
      return arr;
    }, []);
  };
}

export default Ember.ObjectProxy.extend(EmberValidations, FormObjectMixin, {
  isNew: Ember.computed.readOnly('model.isNew'),

  modelProperties: Ember.computed('properties', propertyTypeReducer('model')).volatile(),
  virtualProperties: Ember.computed('properties', propertyTypeReducer('virtual')).volatile(),

  propertiesServerErrors: Ember.computed(() => {
    return {};
  }),
  otherServerErrors: Ember.computed(() => Ember.A()),

  init(container, model, extraProps) {
    Ember.assert('Form object should be instantiated with DS.Model', model instanceof DS.Model);
    this.model = model;
    this.set('content', {});
    this._super(container, extraProps);
  },

  rollbackAttributes() {
    this.model.rollbackAttributes();
  },

  setPropertiesToModel() {
    this._setModelPropertiesToModel();
    this._syncVirtualPropertiesWithModel();
  },

  handleServerValidationErrors() {
    this.get('model.errors.content').forEach(err => {
      const propertyName = err.attribute;
      const value = this.get(propertyName);
      const validationError = { propertyName, value, message: err.message };

      if (propertyName in this.properties) {
        this.get('propertiesServerErrors')[propertyName].pushObject(validationError);
      } else {
        this.get('otherServerErrors').pushObject(validationError);
      }
    });
    this.validate().then(Ember.K).catch(Ember.K);
  },

  beforeSubmit() {
    this.setPropertiesToModel();
  },

  submit() {
    return this.get('model').save().catch(() => {
      const isServerValidationError = true; // TODO: Calculate this
      if (isServerValidationError) {
        this.handleServerValidationErrors();
      }
      this.get('model').rollbackAttributes();
      throw new Ember.Object({ name: isServerValidationError ? 'Server validation error' : 'Error' });
    });
  },

  afterSubmit() {
    this.setAllPropertiesDirtyFlag(false);
  },

  addProperties(properties) {
    const propertiesServerErrors = this.get('propertiesServerErrors');
    _.keys(properties).forEach(propertyName => {
      propertiesServerErrors[propertyName] = Ember.A();
    });
    this._super(...arguments);
    this.syncWithModel();
  },

  removeProperties() {
    this._super(...arguments);
    this.syncWithModel();
  },

  syncWithModel() {
    this.set('content', this.get('modelProperties').reduce((obj, propertyName) => {
      const property = this.get(`properties.${propertyName}`);
      const isAsync = property.async;
      const modelPropertyValue = this.get(`model.${propertyName}`);
      const formPropertyValue = modelPropertyValue;

      // Think about this. Should we enable initialValue if proxied value is undefined?
      // if (formPropertyValue === undefined) {
      //   formPropertyValue = property.initialValue;
      // } else {
      //   property.initialValue = formPropertyValue;
      // }

      if (!isAsync && isThenable(modelPropertyValue)) {
        this.setPropertyState(propertyName, 'isLoaded', false);
        modelPropertyValue.then(runSafe(this, () => this.setPropertyState(propertyName, 'isLoaded', true)));
      }

      obj[propertyName] = formPropertyValue;
      return obj;
    }, {}));
  },

  destroy() {
    const model = this.get('model');
    if (model.get('isNew')) {
      model.deleteRecord();
    }
    this._super(...arguments);
  },

  _initProperty(initialProp, key) {
    initialProp.validate = initialProp.validate || {};
    initialProp.validate.isValidOnServer = true;

    const prop = this._super(...arguments);

    if (prop.virtual) {
      prop.sync = (_.isFunction(prop.sync) && prop.sync) || this[`sync${key[0].toUpperCase()}${key.slice(1)}`];
    }

    return prop;
  },

  _getInitialPropertyDefinition(prop) {
    const propDef = this._super(...arguments);
    propDef.model = !('virtual' in prop && !!prop.virtual);
    propDef.virtual = !propDef.model;
    return propDef;
  },

  _addObservers(propertyNames) {
    this._super(...arguments);
    this._addModelPropertyObservers(propertyNames);
  },

  _removeObservers(propertyNames) {
    this._super(...arguments);
    this._removeModelPropertyObservers(propertyNames);
  },

  _addModelPropertyObservers(propertyNames) {
    this._setModelPropertyObservers('addObserver', propertyNames);
  },

  _removeModelPropertyObservers(propertyNames) {
    this._setModelPropertyObservers('removeObserver', propertyNames);
  },

  _setModelPropertyObservers(methodName, propertyNames) {
    const model = this.get('model');
    propertyNames.forEach(propertyName => {
      if (this.properties[propertyName].model) {
        model[methodName](propertyName, this, this._modelPropertyDidChange);
      }
    });
  },

  _modelPropertyDidChange(obj, propertyName) {
    if (!this.get('isDirty')) {
      this.set(propertyName, obj.get(propertyName));
    } else {
      Ember.Logger.debug('ModelFormObject: Model property did change while form was dirty');
    }
  },

  _setModelPropertiesToModel() {
    this.model.setProperties(this._getModelPropertiesHash());
  },

  _syncVirtualPropertiesWithModel() {
    this.get('virtualProperties').forEach(key => {
      const prop = this.get('properties')[key];
      if (prop.sync) {
        prop.sync.call(this);
      }
    });
  },

  _resolvePropertyForModelPropertiesHash(propName) {
    return depromisifyProperty(this.get(propName));
  },

  _getInitialPropertyValue(propertyName) {
    const property = this.properties[propertyName];
    return property.model ? this.get(`model.${propertyName}`) : this._super(...arguments);
  },

  _getModelPropertiesHash() {
    return this.get('modelProperties').reduce((prev, attr) => {
      prev[attr] = this._resolvePropertyForModelPropertiesHash(attr);
      return prev;
    }, {});
  }
});
