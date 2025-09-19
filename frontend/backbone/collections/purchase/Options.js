import BaseCollection from '../BaseCollection';
import Option from '../../models/purchase/Option';

export default class extends BaseCollection {
  model(attrs, options) {
    return new Option(attrs, options);
  }
}
