import BaseCollection from '../BaseCollection';
import Transaction from '../../models/order/Transaction';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  modelId(attrs) {
    return attrs.txid;
  }
}
