import { Collection } from 'backbone';

export default class extends Collection {
  fetch(options = {}) {
    options.headers = options.headers || {};

    if (!import.meta.env.VITE_APP) {
      const token = localStorage.getItem('token');
      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
      } else {
        options.headers.Gateway = true;
      }
    } else {
      options.headers['X-Mobazha-Node'] = 'default';
    }

    return Collection.prototype.fetch.call(this, options);
  }
};