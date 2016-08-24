import Ember from 'ember';
import DS from 'ember-data';
import EmberValidations from 'ember-validations';
import FormObjectMixin from 'ember-form-object/mixins/form-object';
import {
  depromisifyProperty, depromisifyObject, isThenable, runSafe, isFunction, forOwn
} from 'ember-form-object/utils/core';

const { keys } = Object;
const { ObjectProxy, computed, assert, Logger, run, A: createArray, K: noop } = Ember;

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
    this.validate().then(noop).catch(noop);
  },

  beforeModelSync() {},

  afterModelSync() {},

  beforeSubmit() {
    this._super(...arguments);
    this.beforeModelSync();
    this.setPropertiesToModel();
    this.afterModelSync();
  },

  resetFormAfterSubmit() {
    // Reset model properties dirty state after submit
    forOwn(this.properties, (prop, propName) => {
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
        this._isModelPropertySyncDisabled = true;
        model.rollbackAttributes();
        this._isModelPropertySyncDisabled = false;
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
    keys(properties).forEach(propertyName => {
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
    this.set('content', keys(this.properties).reduce((obj, propertyName) => {
      const property = this.properties[propertyName];

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
          this._setPropertyState(propertyName, 'isLoaded', false);
          modelPropertyValue.then(runSafe(this, () => this._setPropertyState(propertyName, 'isLoaded', true)));
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

  addObservers(propertyNames) {
    this._super(...arguments);
    this._setModelPropertyObservers('addObserver', propertyNames);
  },

  removeObservers(propertyNames) {
    this._super(...arguments);
    this._setModelPropertyObservers('removeObserver', propertyNames);
  },

  normalizePropertyDefinition(prop) {
    const propDef = this._super(...arguments);
    propDef.model = !('virtual' in prop && !!prop.virtual);
    propDef.virtual = !propDef.model;
    return propDef;
  },

  _initProperty(initialProp, key) {
    initialProp.validate = initialProp.validate || {};
    initialProp.validate.isValidOnServer = true;

    const prop = this._super(...arguments);

    if (prop.virtual) {
      prop.sync = (isFunction(prop.sync) && prop.sync) || this[`sync${key[0].toUpperCase()}${key.slice(1)}`];
    }

    return prop;
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
    if (!this._isModelPropertySyncDisabled && !this._modelPropertiesStagedForUpdate[propertyName]) {
      this._modelPropertiesStagedForUpdate[propertyName] = true;
      run.scheduleOnce('sync', this, this._processStagedModelPropertyUpdates);
    }
  },

  _processStagedModelPropertyUpdates() {
    const model = this.get('model');
    keys(this._modelPropertiesStagedForUpdate).forEach((propName) => {
      this._processStagedModelPropertyUpdate(model, propName);
    });
    this._modelPropertiesStagedForUpdate = {};
  },

  _processStagedModelPropertyUpdate(model, propertyName) {
    const areDifferent = depromisifyObject(model.get(propertyName)) !== depromisifyObject(this.get(propertyName));
    if (areDifferent) {
      if (this.get('isSubmitting') || !this.get('isDirty')) {
        this.set(propertyName, model.get(propertyName));
      } else {
        this.modelPropertyConflictDidOccur(model, propertyName);
      }
    }
  },

  _setDirtyModelPropertiesToModel() {
    this._isModelPropertySyncDisabled = true;
    forOwn(this.properties, (prop, propName) => {
      if (prop.model && prop.state.isDirty) {
        this.model.set(propName, depromisifyProperty(this.get(propName)));
      }
    });
    this._isModelPropertySyncDisabled = false;
  },

  _syncVirtualPropertiesWithModel() {
    this._isModelPropertySyncDisabled = true;
    forOwn(this.properties, (property) => {
      if (property.virtual && property.sync) {
        property.sync.call(this);
      }
    });
    this._isModelPropertySyncDisabled = false;
  },

  _getInitialPropertyValue(propertyName) {
    const property = this.properties[propertyName];
    return property.model ? this.get(`model.${propertyName}`) : this._super(...arguments);
  }
});
