import Ember from 'ember';

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
  if (err.isAdapterError) {
    return err;
  }
  throw err;
}

export {
  serverResponseError,
  catchServerResponseError
}
