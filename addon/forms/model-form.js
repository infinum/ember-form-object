import _ from 'lodash';
import Ember from 'ember';
import DS from 'ember-data';
import EmberValidations from 'ember-validations';
import FormObjectMixin from 'ember-form-object/mixins/form-object';
import { depromisifyProperty, depromisifyObject, isThenable, runSafe } from 'ember-form-object/utils/core';

const { ObjectProxy, computed, assert, Logger, run, A, K } = Ember;
const createArray = A;

export default ObjectProxy.extend(EmberValidations, FormObjectMixin, {
  isNew: computed.readOnly('model.isNew'),

  propertiesServerErrors: computed(function() {
    return {};
  }),

  otherServerErrors: computed(function() {
    return createArray();
  }),

  init(container, model, extraProps) {
    assert('Form object should be instantiated with DS.Model', model instanceof DS.Model);
    this.model = model;
    this.set('content', {});
    this._modelPropertiesStagedForUpdate = {};
    this._super(container, extraProps);
  },

  rollbackAttributes() {
    this.model.rollbackAttributes();
  },

  setPropertiesToModel() {
    this._setDirtyModelPropertiesToModel();
    this._syncVirtualPropertiesWithModel();
  },

  handleServerValidationErrors() {
    this.get('model.errors.content').forEach(err => {
      const propertyName = err.attribute;
      const value = this.get(propertyName);
      const validationError = {
        propertyName, value, message: err.message
      };

      if (propertyName in this.properties) {
        this.get('propertiesServerErrors')[propertyName].pushObject(validationError);
      } else {
        this.get('otherServerErrors').pushObject(validationError);
      }
    });
    this.validate().then(K).catch(K);
  },

  beforeSubmit() {
    this.setPropertiesToModel();
  },

  resetFormAfterSubmit() {
    // Reset model properties dirty state after submit
    _.forEach(this.properties, (prop, propName) => {
      if (prop.model) {
        this.set(`properties.${propName}.state.isDirty`, false);
      }
    });

    return this._super(...arguments);
  },

  submit() {
    const model = this.get('model');
    return model.save().catch((response) => {
      const isServerValidationError = response.isAdapterError && model.get('errors.length') > 0;

      if (isServerValidationError) {
        this.handleServerValidationErrors();
      }

      if (!model.get('isNew')) {
        this._isRollbackingOnServerValidationError = true;
        model.rollbackAttributes();
        this._isRollbackingOnServerValidationError = false;
      }

      throw new Ember.Object({
        isServerValidationError,
        response,
        name: isServerValidationError ? 'Server validation error' : 'Error'
      });
    });
  },

  addProperties(properties) {
    const propertiesServerErrors = this.get('propertiesServerErrors');
    _.keys(properties).forEach(propertyName => {
      propertiesServerErrors[propertyName] = createArray();
    });
    this._super(...arguments);
    this.syncWithModel();
  },

  removeProperties() {
    this._super(...arguments);
    this.syncWithModel();
  },

  syncWithModel() {
    this.set('content', _.reduce(this.properties, (obj, property, propertyName) => {
      if (property.model) {
        const modelPropertyValue = this.get(`model.${propertyName}`);
        const formPropertyValue = modelPropertyValue;

        // Should we enable initialValue if proxied value is undefined?
        // if (formPropertyValue === undefined) {
        //   formPropertyValue = property.initialValue;
        // } else {
        //   property.initialValue = formPropertyValue;
        // }

        if (!property.async && isThenable(modelPropertyValue)) {
          this.setPropertyState(propertyName, 'isLoaded', false);
          modelPropertyValue.then(runSafe(this, () => this.setPropertyState(propertyName, 'isLoaded', true)));
        }

        obj[propertyName] = formPropertyValue;
      }

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

  modelPropertyConflictDidOccur(model, propertyName) {
    Logger.debug(`ModelFormObject: Model property "${propertyName}" did change while form was dirty`);
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

  _modelPropertyDidChange(model, propertyName) {
    Logger.log('Model property did change', propertyName);
    if (!this._isRollbackingOnServerValidationError && !this._modelPropertiesStagedForUpdate[propertyName]) {
      this._modelPropertiesStagedForUpdate[propertyName] = true;
      run.scheduleOnce('sync', this, this._processStagedModelPropertyUpdates);
    }
  },

  _processStagedModelPropertyUpdates() {
    const model = this.get('model');
    Logger.log('Processing staged model property updates', Object.keys(this._modelPropertiesStagedForUpdate));
    _.forEach(this._modelPropertiesStagedForUpdate, (_val, propertyName) => {
      this._processStagedModelPropertyUpdate(model, propertyName);
    });
    this._modelPropertiesStagedForUpdate = {};
  },

  _processStagedModelPropertyUpdate(model, propertyName) {
    const areDifferent = depromisifyObject(model.get(propertyName)) !== depromisifyObject(this.get(propertyName));
    if (areDifferent) {
      if (this.get('isSubmiting') || !this.get('isDirty')) {
        this.set(propertyName, model.get(propertyName));
      } else {
        this.modelPropertyConflictDidOccur(model, propertyName);
      }
    }
  },

  _setDirtyModelPropertiesToModel() {
    _.forEach(this.properties, (prop, propName) => {
      if (prop.model && prop.state.isDirty) {
        this.model.set(propName, depromisifyProperty(this.get(propName)));
      }
    });
  },

  _syncVirtualPropertiesWithModel() {
    _.forEach(this.properties, (property) => {
      if (property.virtual && property.sync) {
        property.sync.call(this);
      }
    });
  },

  _getInitialPropertyValue(propertyName) {
    const property = this.properties[propertyName];
    return property.model ? this.get(`model.${propertyName}`) : this._super(...arguments);
  }
});
