import Ember from 'ember';

function getComparable(val) {
  return val instanceof Ember.ObjectProxy ? val.get('content') : val;
}

export function eq(params) {
  return getComparable(params[0]) === getComparable(params[1]);
}

export default Ember.Helper.helper(eq);
