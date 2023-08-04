import BaseCollection from '../BaseCollection';
import Item from '../../models/purchase/Item';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Item(attrs, options);
  }

  modelId(attrs) {
    return attrs.listingHash;
  }
}
