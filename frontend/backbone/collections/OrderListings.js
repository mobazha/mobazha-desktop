import BaseCollection from './BaseCollection';
import Listing from '../models/listing/Listing';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Listing(attrs, options);
  }

  modelId(attrs) {
    return attrs.hash;
  }
}
