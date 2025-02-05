import { guid } from '../../utils';
import BaseCollection from '../BaseCollection';
import ShippingOption from '../../models/settings/ShippingOption';

export default class extends BaseCollection {
  model(attrs, options) {
    return new ShippingOption({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
