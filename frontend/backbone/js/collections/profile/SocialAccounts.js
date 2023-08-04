import { guid } from '../../utils';
import BaseCollection from '../BaseCollection';
import SocialAccount from '../../models/profile/SocialAccount';

export default class extends BaseCollection {
  model(attrs, options) {
    return new SocialAccount({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
