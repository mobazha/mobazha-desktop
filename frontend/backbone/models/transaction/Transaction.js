// used for sales, purchases
import { curDefToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderID';
  }

  parse(response = {}) {
    let parsedTotal = response.total;
    
    // Handle cases where currency is empty or invalid
    if (response.total && response.total.currency) {
      const { currency } = response.total;

      const isValidCurrency = currency && currency.code && currency.divisibility 
      if (isValidCurrency) {
        try {
          parsedTotal = curDefToDecimal(response.total);
        } catch (e) {
          console.warn('Failed to parse currency definition, keeping original total:', e.message);
          parsedTotal = response.total;
        }
      } else {
        console.warn('Invalid currency definition, keeping original total:', {
          code: currency?.code,
          divisibility: currency?.divisibility
        });
        parsedTotal = response.total;
      }
    }
    
    return {
      ...response,
      total: parsedTotal,
    };
  }
}
