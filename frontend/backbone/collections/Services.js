import { guid } from '../utils';
import BaseCollection from './BaseCollection';
import Service from '../models/settings/Service';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Service({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
