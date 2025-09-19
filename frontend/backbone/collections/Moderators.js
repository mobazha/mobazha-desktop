import BaseCollection from './BaseCollection';
import Profile from '../models/profile/Profile';


export default class extends BaseCollection {
  model(attrs, options) {
    return new Profile(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerID;
  }
}
