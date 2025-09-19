import BaseCollection from './BaseCollection';
import StatusMessage from '../models/StatusMessage';

export default class extends BaseCollection {
  model(attrs, options) {
    return new StatusMessage(attrs, options);
  }
}
