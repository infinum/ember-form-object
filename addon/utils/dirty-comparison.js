import Ember from 'ember';
import { depromisifyProperty, isPlainObject } from 'ember-form-object/utils/core';

const { keys } = Object;
const { isArray } = Ember;

function normalizeValueForDirtyComparison(val, isValArray) {
  let normalizedVal = depromisifyProperty(val);

  if (!normalizedVal && isValArray) {
    normalizedVal = [];
  } else if (normalizedVal === null) {
    normalizedVal = undefined;
  }

  return normalizedVal;
}

function areTwoValuesEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (a && typeof a.isEqual === 'function' && a.isEqual(b)) {
    return true;
  }

  if (isArray(a) && isArray(b) && a.length === b.length) {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = keys(a);
    const bKeys = keys(b);

    if (aKeys.length === bKeys.length) {
      for (let i = 0; i < aKeys.length; i += 1) {
        const key = aKeys[i];

        if (a[key] !== b[key]) {
          return false;
        }
      }

      return true;
    }
  }

  if (a instanceof Date && b instanceof Date && a.getTime() === b.getTime()) {
    return true;
  }

  return false;
}

export {
  normalizeValueForDirtyComparison,
  areTwoValuesEqual
};
