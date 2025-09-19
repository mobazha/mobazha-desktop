import BaseCollection from './BaseCollection';
import BaseModel from '../models/BaseModel';


export default class extends BaseCollection {
  model(attrs, options) {
    return new BaseModel(attrs, options);
  }
}
