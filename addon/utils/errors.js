import Ember from 'ember';
import {every} from 'ember-form-object/utils/core';

const {Object: EmberObject} = Ember;

function serverResponseError(res) {
  if (res && ((res.errors && res.errors.length && res.errors[0].status) || res.isAdapterError)) {
    const isServerValidationError = res.errors && res.errors.length && res.errors[0].status === '422';
    return new EmberObject({
      isAdapterError: true,
      isServerValidationError,
      response: res,
      name: isServerValidationError ? 'Server validation error' : 'Error'
    });
  }

  return res;
}

function catchServerResponseError(err) {
  if (err && err.isAdapterError) {
    return err;
  }
  throw err;
}

function catchServerValidationError(err) {
  if (err && err.isAdapterError && every(err.errors, (e) => e.status === '422')) {
    return err;
  }
  throw err;
}

export {
  serverResponseError,
  catchServerResponseError,
  catchServerValidationError
}
