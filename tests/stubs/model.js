import Ember from 'ember';
import DS from 'ember-data';

function createMockModelClass(modelName) {
  return DS.Model.extend({
    isNew: true,
    errors: {},
    _internalModel: {
      modelName: modelName || '',
      clearRelationships() {},
      recordObjectWillDestroy() {},
      deleteRecord() {}
    },
    deleteRecord() {},
    rollbackAttributes() {},
    save() {
      return Ember.RSVP.resolve(this);
    }
  });
}

const MockModel = createMockModelClass();

const TestModel = createMockModelClass('test').extend({
  modelProp1: '',
  modelProp2: '',
  modelProp3: '',
  modelProp4: '4'
});

export {
  createMockModelClass,
  MockModel,
  TestModel
};
