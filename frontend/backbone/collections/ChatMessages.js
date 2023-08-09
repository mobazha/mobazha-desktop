import app from '../app';
import BaseCollection from './BaseCollection';
import ChatMessage from '../models/chat/ChatMessage';

export default class extends BaseCollection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.guid = options.guid;
  }

  model(attrs, options) {
    return new ChatMessage(attrs, options);
  }

  modelId(attrs) {
    return attrs.messageID;
  }

  comparator(message) {
    return message.get('timestamp');
  }

  url() {
    let url = app.getServerUrl('ob/groupchatmessages');
    if (this.guid) url += `/${this.guid}`;
    return url;
  }
}
