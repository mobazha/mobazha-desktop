import { guid } from '../../utils';
import { Collection } from 'backbone';
<<<<<<<< HEAD:frontend/backbone/collections/listing/ShippingOptions.js
import Download from '../../models/listing/Download';
========
import ShippingOption from '../../models/settings/ShippingOption';
>>>>>>>> 375741b18 (Fix shippingOptions issues and update related file paths):frontend/backbone/collections/settings/ShippingOptions.js

export default class extends Collection {
  model(attrs, options) {
    return new Download({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
