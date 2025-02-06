import { Collection } from 'backbone';

export default class extends Collection {
  fetch(options = {}) {
    options.headers = {
      ...options.headers,
      'X-Mobazha-Node': 'test'
    };
    return Collection.prototype.fetch.call(this, options);
  }
};