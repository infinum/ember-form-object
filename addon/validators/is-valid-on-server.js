import Base from 'ember-validations/validators/base';

export default Base.extend({
  init: function() {
    this._super();
    if (this.options === true) {
      this.options = {};
    }
  },

  call: function() {
    const value = this.model.get(`${this.property}`);
    const propertyServerErrors = this.model.get('propertiesServerErrors')[this.property];
    propertyServerErrors.forEach(propertyServerError => {
      if (propertyServerError.value === value) {
        this.errors.pushObject(propertyServerError.message);
      }
    });
  }
});
