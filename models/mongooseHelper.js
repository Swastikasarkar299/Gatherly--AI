let mongoose = null;

try {
  mongoose = require('mongoose');
} catch (e) {
  // Mock Schema for environments before npm install
  class MockSchema {
    constructor(definition, options) {
      this.definition = definition;
      this.options = options;
      this._virtuals = {};
    }
    virtual(name) {
      return {
        get: (fn) => { this._virtuals[name] = fn; return this; }
      };
    }
  }

  MockSchema.Types = {
    ObjectId: String,
    Mixed: Object
  };

  mongoose = {
    Schema: MockSchema,
    model: (name, schema) => ({ name, schema }),
    models: {}
  };
}

module.exports = mongoose;

