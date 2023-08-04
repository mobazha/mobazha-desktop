import BaseCollection from '../BaseCollection';
import Rating from '../../models/order/orderCompletion/Rating';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Rating(attrs, options);
  }

  parse(response) {
    return response;
  }
}
