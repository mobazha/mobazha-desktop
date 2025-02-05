import BaseCollection from './BaseCollection';

export default class extends Collection {
  fetch(options = {}) {
    options.headers = {
      ...options.headers,
      'X-Mobazha-User': 'test'
    };
    return Collection.prototype.fetch.call(this, options);
  }
};