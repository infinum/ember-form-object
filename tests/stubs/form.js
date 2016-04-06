import Ember from 'ember';

const modelFormObjectClassProps = {
  properties: {
    'virtualProp1': {
      virtual: true,
      validate: { presence: true }
    },
    'modelProp1': {
      validate: { presence: true }
    },
    'modelProp2': {
      async: true
    }
  },

  syncVirtualProp1() {
    this.set('model.modelProp3', this.get('virtualProp1'));
  }
};

const baseFormObjectClassProps = {
  properties: {
    'test': {
      validate: { presence: true },
      value: ''
    },
    'test2': {
      validate: { presence: true }
    },
    'test3': {
      async: true
    }
  },

  setTest2() {
    return 'pero';
  },

  submit() {
    return Ember.RSVP.resolve();
  }
};

export {
  baseFormObjectClassProps,
  modelFormObjectClassProps
};
