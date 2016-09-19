import Ember from 'ember';
import { superWasCalled, ensureSuperWasCalled } from 'ember-form-object/utils/super';
import { normalizeValueForDirtyComparison, areTwoValuesEqual } from 'ember-form-object/utils/dirty-comparison';
import {
  isThenable, runSafe, isFunction, isPlainObject, some, every, result, cloneDeep
} from 'ember-form-object/utils/core';

const { keys } = Object;
const { Mixin, assert, Logger, RSVP, A: createArray, on, isArray } = Ember;

export default Mixin.create({
  init(owner, extraProps) {
    assert('Form object should be instantiated with an owner object', !!owner && 'lookup' in owner);
    superWasCalled(this, 'init');

    // So ember-validations can load it's stuff
    if (Ember.setOwner) {
      Ember.setOwner(this, owner);
    } else {
      this.container = owner.ownerInjection().container;
    }

    this.validations = cloneDeep(this.validations || {});
    this.properties = cloneDeep(this.properties || {});

    this.isSubmitting = false;
    this.isDirty = false;
    this.isLoaded = false;
    this.isSaveError = false;

    this.addProperties(this.properties);

    if (isPlainObject(extraProps)) {
      keys(extraProps).forEach((key) => this.set(key, extraProps[key]));
    }

    this._super(...arguments);
  },

  onInit: on('init', function() {
    ensureSuperWasCalled(this, 'init');
    const propertyNames = keys(this.properties);
    this._setCalculatedValuesToVirtualProperties(propertyNames);
    this._updateIsLoaded();
    this.addObservers(propertyNames);
    this._isInitialized = true;
  }),

  destroy() {
    this._super(...arguments);
    this.removeObservers(keys(this.properties));
  },

  beforeSubmit() {
    superWasCalled(this, 'beforeSubmit');
  },

  afterSubmit() {
    superWasCalled(this, 'afterSubmit');
  },

  resetFormAfterSubmit() {
    this._setCalculatedValuesToVirtualProperties(keys(this.properties));

    // Form can't be dirty after submit
    this.set('isDirty', false);
    this.set('isSaveError', false);
  },

  submit() {
    assert('Has to be implemented', false);
  },

  save() {
    if (!this.get('isDirty')) {
      return RSVP.reject('Form object is not dirty');
    }

    return this.validate().then(runSafe(this, (res) => {
      this.set('isSubmitting', true);
      const beforeSubmitResult = this.beforeSubmit(...arguments);
      ensureSuperWasCalled(this, 'beforeSubmit');
      return beforeSubmitResult || res;
    })).then(runSafe(this, (res) => {
      return this.submit(...arguments) || res;
    })).then(runSafe(this, (res) => {
      const afterSubmitResult = this.afterSubmit(...arguments);
      ensureSuperWasCalled(this, 'afterSubmit');
      return afterSubmitResult || res;
    })).then(runSafe(this, (res) => {
      return this.resetFormAfterSubmit() || res;
    })).catch((e) => {
      this.set('isSaveError', true);
      this.handleSaveError(e);
    }).finally(runSafe(this, () => {
      this.set('isSubmitting', false);
    }));
  },

  handleSaveError(err) {
    Logger.warn(err);
    throw err;
  },

  commitState() {
    keys(this.properties).forEach((propertyName) => {
      this.properties[propertyName].initialValue = this.get(propertyName);
      this._setPropertyState(propertyName, 'isDirty', false);
    });
  },

  addProperties(properties) {
    const propertyNames = keys(properties);
    const validationKeys = [];

    propertyNames.forEach((key) => {
      this.properties[key] = this._initProperty(properties[key], key);

      if (isPlainObject(this.properties[key].validate)) {
        validationKeys.push(key);
      }
    });

    if (this._isInitialized) {
      this._setCalculatedValuesToVirtualProperties(propertyNames);
      this._updateIsLoaded();
      this.addObservers(propertyNames);

      this._initDynamicallyAddedValidations(validationKeys);
    }
  },

  removeProperties(propertyNames) {
    this.removeObservers(propertyNames);
    propertyNames.forEach(propertyName => this._removeProperty(propertyName));
  },

  isPropertyValid(propertyName) {
    return !this.get(`errors.${propertyName}.length`);
  },

  addObservers(propertyNames) {
    propertyNames.forEach(propertyName => this.addObserver(propertyName, this, this._formPropertyDidChange));
  },

  removeObservers(propertyNames) {
    propertyNames.forEach(propertyName => this.removeObserver(propertyName, this, this._formPropertyDidChange));
  },

  normalizePropertyDefinition(prop) {
    return {
      virtual: 'virtual' in prop ? !!prop.virtual : true,
      async: 'async' in prop ? !!prop.async : false,
      readonly: 'readonly' in prop ? !!prop.readonly : false,
      initialValue: 'value' in prop ? result(prop, 'value') : null,
      validate: prop.validate || null,
      ordered: prop.ordered || false
    };
  },

  calculateIsDirty(lastFlag) {
    return lastFlag === true ? true : some(this.properties, prop => prop.state.isDirty);
  },

  calculateIsLoaded(lastFlag) {
    return lastFlag === false ? false : every(this.properties, prop => prop.state.isLoaded);
  },

  _setPropertyState(propertyName, stateName, flag) {
    this.set(`properties.${propertyName}.state.${stateName}`, !!flag);
    const calculateMethod = `calculate${stateName[0].toUpperCase()}${stateName.slice(1)}`;
    if (calculateMethod in this) {
      this.set(stateName, this[calculateMethod](flag));
    }
  },

  _initDynamicallyAddedValidations(validationKeys) {
    validationKeys.forEach(validationKey => {
      if (this.validations[validationKey].constructor === Object) {
        this.buildRuleValidator(validationKey);
      } else {
        this.buildObjectValidator(validationKey);
      }

      const validator = this.validators.findBy('property', validationKey);
      assert('Something went wrong with dynamically added validations in form object', !!validator);
      this._initDynamicallyAddedValidator(validator);
    });
    this.validators.invoke('_validate').without(undefined);
  },

  _initDynamicallyAddedValidator(validator) {
    validator.addObserver('errors.[]', this, function(sender) {
      const errors = createArray();
      this.validators.forEach(function(innerValidator) {
        if (innerValidator.property === sender.property) {
          errors.addObjects(innerValidator.errors);
        }
      }, this);
      this.set('errors.' + sender.property, errors);
    });
  },

  _setCalculatedValuesToVirtualProperties(propertyNames) {
    propertyNames.forEach(propertyName => {
      const prop = this.properties[propertyName];

      if (prop && prop.virtual && isFunction(prop.set)) {
        const val = prop.set.call(this);

        if (isThenable(val)) {
          val.then(runSafe(this, (resolvedVal) => {
            prop.initialValue = resolvedVal;
            this.set(propertyName, prop.initialValue);
          }));
        } else {
          prop.initialValue = val;
          this.set(propertyName, prop.initialValue);
          this._setPropertyState(propertyName, 'isLoaded', true);
        }
      }
    });
  },

  _removeProperty(propertyName) {
    this.set(propertyName, void 0);
    delete this.properties[propertyName];
    delete this.validations[propertyName];
    delete this[propertyName];
  },

  _initProperty(initialProp, key) {
    const prop = this.normalizePropertyDefinition(isPlainObject(initialProp) ? initialProp : {});
    prop.state = this._getInitialPropertyState(prop);

    if (prop.virtual) {
      prop.set = (isFunction(prop.set) && prop.set) || this[`set${key[0].toUpperCase()}${key.slice(1)}`];
      this[key] = prop.initialValue;
    }

    if (prop.async) {
      prop.state.isLoaded = false;
    }

    if (prop.validate) {
      this.validations[key] = prop.validate;
    }

    return prop;
  },

  _getInitialPropertyState(prop) {
    return {
      isDirty: false,
      isLoaded: !prop.async
    };
  },

  _getInitialPropertyValue(propertyName) {
    return this.properties[propertyName].initialValue;
  },

  _formPropertyDidChange(obj, propertyName) {
    const prop = this.get(`properties.${propertyName}`);
    const value = this.get(propertyName);
    const isThenableValue = isThenable(value);

    if (isThenableValue && !value.isFulfilled) {
      this._setPropertyState(propertyName, 'isLoaded', false);
      value.then(runSafe(this, (resolvedValue) => {
        this.set(propertyName, resolvedValue);
      }));
    } else if (!prop.state.isLoaded) {
      this._setPropertyState(propertyName, 'isLoaded', true);
    } else if (!prop.readonly) {
      this._setPropertyState(propertyName, 'isDirty', this._shouldPropertyBecomeDirty(propertyName));
    }
  },

  _shouldPropertyBecomeDirty(propertyName) {
    const value = this.get(propertyName);
    const initialValue = this._getInitialPropertyValue(propertyName);
    const normalizedValue = normalizeValueForDirtyComparison(value);
    const normalizedInitialValue = normalizeValueForDirtyComparison(initialValue, isArray(normalizedValue));
    const takeOrderIntoAccount = this.properties[propertyName].ordered;

    const opts = {
      takeOrderIntoAccount
    };

    return !areTwoValuesEqual(normalizedValue, normalizedInitialValue, opts);
  },

  _updateIsDirty() {
    this.set('isDirty', this.calculateIsDirty());
  },

  _updateIsLoaded() {
    this.set('isLoaded', this.calculateIsLoaded());
  }
});
