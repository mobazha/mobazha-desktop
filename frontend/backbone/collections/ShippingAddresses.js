import { guid } from '../utils';
import BaseCollection from './BaseCollection';
import ShippingAddress from '../models/settings/ShippingAddress';

export default class extends BaseCollection {
  model(attrs, options) {
    return new ShippingAddress({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
