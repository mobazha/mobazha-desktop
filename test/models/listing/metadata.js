import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import sinon from 'sinon';
import * as walletCurMod from '../../../js/data/walletCurrencies';
import Metadata from '../../../js/models/listing/Metadata';

describe('the Metadata model', () => {
  let supportedWalletCurStub;

  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };

    supportedWalletCurStub = (() => {
      const originalIsSupportedWalletCur = walletCurMod.isSupportedWalletCur;
      return sinon.stub(walletCurMod, 'isSupportedWalletCur',
        (cur, options = {}) => (
          originalIsSupportedWalletCur(cur, {
            ...options,
            serverCurs: ['BTC', 'ZEC'],
          })
        ));
    })();
  });

  it('fails validation if the contract type is not one of the available types', () => {
    const metadata = new Metadata();
    metadata.set({
      contractType: 'boom bam bizzle',
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.contractType && !!valErr.contractType.length || false).to.equal(true);
  });

  it('fails validation if a date in the past is provided', () => {
    const metadata = new Metadata();
    metadata.set({
      expiry: (new Date(1937, 11, 31, 0, 0, 0, 0)).toISOString(),
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.expiry && !!valErr.expiry.length || false).to.equal(true);
  });

  it('fails validation if a date beyond 2038 is provided', () => {
    const metadata = new Metadata();
    metadata.set({
      expiry: (new Date(2038, 5, 5, 0, 0, 0, 0)).toISOString(),
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.expiry && !!valErr.expiry.length || false).to.equal(true);
  });

  after(function () {
    supportedWalletCurStub.restore();
  });
});

