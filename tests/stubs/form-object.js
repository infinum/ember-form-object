import Ember from 'ember';
import DS from 'ember-data';

const MockModel = DS.Model.extend({
  isNew: true,
  _internalModel: {
    clearRelationships() {},
    recordObjectWillDestroy() {}
  },
  rollback() {},
  save() {
    return Ember.RSVP.resolve(this);
  }
});

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

const TestModel = MockModel.extend({
  modelProp1: '',
  modelProp2: '',
  modelProp3: '',
  modelProp4: '4'
});

const TimeEntryModel = MockModel.extend({
  service: null,
  note: null,
  date: null,
  time: 0
});

export {
  baseFormObjectClassProps,
  modelFormObjectClassProps,
  TestModel,
  TimeEntryModel
};
