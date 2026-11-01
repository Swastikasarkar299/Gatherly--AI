let express = null;

try {
  express = require('express');
} catch (e) {
  class MockRouter {
    constructor() {
      this.stack = [];
    }
    get(path, ...handlers) {
      this.stack.push({ method: 'GET', path, handlers });
      return this;
    }
    post(path, ...handlers) {
      this.stack.push({ method: 'POST', path, handlers });
      return this;
    }
    put(path, ...handlers) {
      this.stack.push({ method: 'PUT', path, handlers });
      return this;
    }
    delete(path, ...handlers) {
      this.stack.push({ method: 'DELETE', path, handlers });
      return this;
    }
    use(...args) {
      return this;
    }
  }

  express = {
    Router: () => new MockRouter()
  };
}

module.exports = express;

