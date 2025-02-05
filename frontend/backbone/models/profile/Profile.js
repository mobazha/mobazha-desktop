/* eslint-disable class-methods-use-this */
import $ from 'jquery';
import app from '../../app';
import { myPost } from '../../../src/api/api';
import { guid } from '../../utils';
import { getSocket } from '../../utils/serverConnect';
import {
  decimalToCurDef,
  curDefToDecimal,
} from '../../utils/currency';
import BaseModel from '../BaseModel';
import Image from './Image';
import Moderator from './Moderator';
import { feeTypes } from './Fee';
import Colors from './Colors';
import Contact from './Contact';
import Stats from './Stats';

export default class Profile extends BaseModel {
  defaults() {
    return {
      about: '',
      handle: '',
      location: '',
      moderator: false,
      name: `OB ${(Math.floor(Math.random() * 2116316159) + 60466176).toString(36)}`,
      nsfw: false,
      shortDescription: '',
      avatarHashes: new Image(),
      headerHashes: new Image(),
      vendor: true,
      colors: new Colors(),
      contactInfo: new Contact(),
      stats: new Stats(),
    };
  }

  url() {
    if (this.id) {
      return app.getServerUrl(`ob/profile/${this.id}`);
    }
    return app.getServerUrl('ob/profile');
  }

  // todo: set peerID instead of ID when setting ID.
  get idAttribute() {
    return 'peerID';
  }

  get nested() {
    return {
      avatarHashes: Image,
      headerHashes: Image,
      moderatorInfo: Moderator,
      colors: Colors,
      contactInfo: Contact,
      stats: BaseModel,
    };
  }

  get isModerator() {
    return this.get('moderator')
      && !!this.get('moderatorInfo');
  }

  get isVerified() {
    return !!app.verifiedMods.get(this.id);
  }

  hasModCurrency(cur) {
    const modInfo = this.get('moderatorInfo');
    const acceptedCurs = modInfo ? modInfo.get('acceptedCurrencies') : [];
    return Array.isArray(acceptedCurs) && acceptedCurs.includes(cur);
  }

  get max() {
    return {
      locationLength: 100,
      shortDescriptionLength: 160,
    };
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors();
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('name', app.polyglot.t('profileModelErrors.provideName'));
    }

    if (attrs.handle && attrs.handle.charAt(0) === '@') {
      addError('handle', 'The handle should not start with a leading @.');
    }

    if (attrs.location && attrs.location.length > this.max.locationLength) {
      addError('location', app.polyglot.t('profileModelErrors.locationTooLong'));
    }

    if (typeof attrs.vendor !== 'boolean') {
      // this error should never be visible to the user
      addError('vendor', `The vendor value is not a boolean: ${attrs.vendor}`);
    }

    if (typeof attrs.shortDescription !== 'string') {
      addError('shortDescription', 'The shortDescription must be provided as a string.');
    } else if (attrs.shortDescription > this.max.shortDescriptionLength) {
      addError(
        'shortDescription',
        app.polyglot.t('profileModelErrors.shortDescriptionTooLong', { count: this.max.shortDescriptionLength }),
      );
    }

    // We'll delete the moderatorInfo errors, because we'll revalidate below passing
    // in the appropriate flag on whether required fields should be validated.
    Object.keys(errObj).forEach((key) => {
      if (key.startsWith('moderatorInfo')) delete errObj[key];
    });

    if (attrs.moderatorInfo instanceof Moderator) {
      const validateRequiredFields = !!this.get('moderator');
      const errs = attrs.moderatorInfo.isValid({ validateRequiredFields })
        ? {} : attrs.moderatorInfo.validationError;
      Object.keys(errs).forEach((key) => {
        errObj[`moderatorInfo.${key}`] = errs[key];
      });
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  // Ensure any colors are strings and have a leading hash.
  standardizeColorFields(attrs = {}) {
    const updatedAttrs = { ...attrs };

    Object.keys(attrs).forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = updatedAttrs[field].toString();
        updatedAttrs[field] = updatedAttrs[field].charAt(0) !== '#'
          ? `#${updatedAttrs[field]}` : updatedAttrs[field];
      }
    });

    return updatedAttrs;
  }

  parse(resp) {
    const response = { ...resp };

    if (
      response.moderatorInfo
      && response.moderatorInfo.fee
      && response.moderatorInfo.fee.feeType !== 'PERCENTAGE'
      && response.moderatorInfo.fee.fixedFee
    ) {
      try {
        if (response.moderatorInfo.fee.fixedFee.amount === '') { // legacy fixed fee
          response.moderatorInfo.fee.fixedFee = {
            amount: response.moderatorInfo.fee.fixedFee.amount,
            currencyKey: response.moderatorInfo.fee.fixedFee.currency.code,
          };
        } else {
          response.moderatorInfo.fee.fixedFee = {
            amount: curDefToDecimal(response.moderatorInfo.fee.fixedFee, {
              amountKey: 'amount',
              currencyKey: 'currency',
            }),
            currency: {
              code: response.moderatorInfo.fee.fixedFee.currency.code,
            }
          };
        }
      } catch (e) {
        delete response.moderatorInfo.fixedFee;
        console.error(`Unable to convert the moderator fee from base units: ${e.message}`);
      }
    }

    if (response.handle && response.handle.startsWith('@')) {
      response.handle = response.handle.slice(1);
    }

    if (response.colors) {
      response.colors = this.standardizeColorFields(response.colors);
    }

    if (response.avatarHashes === null) {
      delete response.avatarHashes;
    }

    if (response.headerHashes === null) {
      delete response.headerHashes;
    }

    return response;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    // ensure certain fields that shouldn't be updated don't go
    // to the server
    if (method !== 'read') {
      delete options.attrs.lastModified;

      if (options.attrs.stats) delete options.attrs.stats;

      const images = [options.attrs.avatarHashes, options.attrs.headerHashes];
      images.forEach((imageHashes) => {
        if (typeof imageHashes === 'object') {
          // If the image models are still in their default state (all images hashes as empty
          // strings), we won't send over the image to the server, since it will fail validation.
          if (Object.keys(imageHashes).filter((key) => imageHashes[key] === '').length
            === Object.keys(imageHashes).length) {
            if (imageHashes === options.attrs.avatarHashes) {
              delete options.attrs.avatarHashes;
            } else {
              delete options.attrs.headerHashes;
            }
          }
        }
      });

      if (method !== 'delete') {
        if (
          options.attrs.moderatorInfo
          && options.attrs.moderatorInfo.fee
        ) {
          if (options.attrs.moderatorInfo.fee.feeType === feeTypes.PERCENTAGE) {
            delete options.attrs.moderatorInfo.fee.fixedFee;
          } else {
            const { amount } = options.attrs.moderatorInfo.fee.fixedFee;
            const cur = options.attrs.moderatorInfo.fee.fixedFee.currency.code;
            options.attrs.moderatorInfo.fee.fixedFee = decimalToCurDef(amount, cur, {
              amountKey: 'amount',
              currencyKey: 'currency',
            });

            if (options.attrs.moderatorInfo.fee.feeType === feeTypes.FIXED) {
              options.attrs.moderatorInfo.fee.percentage = 0;
            }
          }
        }
      }
    }

    if (method !== 'create' && !this.get('peerID')) {
      throw new Error('I am unable to fetch, save or delete because the model does not'
        + ' have a peerID set.');
    }

    return super.sync(method, model, options);
  }
}

const maxCachedProfiles = 500;
const profileCacheExpires = 1000 * 60 * 60;
const profileCache = new Map();
let profileCacheExpiredInterval;

function expireCachedProfile(peerID) {
  if (!peerID) {
    throw new Error('Please provide a peerID');
  }

  const cached = profileCache.get(peerID);

  if (cached) {
    cached.deferred.reject({
      errCode: 'TIMED_OUT',
      error: 'The profile fetch timed out.',
    });
  }

  profileCache.delete(peerID);
}

/**
 * This function will fetch a list of profiles via the profiles api utilizing
 * the async and usecache flags. It will return a list of promises that will
 * each resolve when their respective profile arrives via socket.
 * @param {Array} peerIDs List of peerID for whose profiles to fetch.
 * @returns {Array} An array of promises corresponding to the array of passed
 * in peerIDs. Each promise will resolve when it's respective profile is received
 * via the socket. A profile model will be passed in the resolve handler.
 */
export function getCachedProfiles(peerIDs = []) {
  if (!(Array.isArray(peerIDs))) {
    throw new Error('Please provide a list of peerIDs.');
  }

  if (!peerIDs.length) {
    throw new Error('Please provide at least one peerID.');
  }

  peerIDs.forEach((id) => {
    if (typeof id !== 'string') {
      throw new Error('One or more of the provided peerIDs are not strings.');
    }
  });

  const promises = [];
  const profilesToFetch = [];
  const profilesReceived = [];
  let socket;

  if (!profileCacheExpiredInterval) {
    // Check every few minutes and clean up any expired cached profiles
    profileCacheExpiredInterval = setInterval(() => {
      profileCache.forEach((cached, key) => {
        if (Date.now() - cached.createdAt >= profileCacheExpires) {
          expireCachedProfile(key);
        }
      });
    }, 1000 * 60 * 5);
  }

  peerIDs.forEach((id) => {
    let cached = profileCache.get(id);

    // make sure it's not expired
    if (cached && Date.now() - cached.createdAt >= profileCacheExpires) {
      expireCachedProfile(id);
      cached = null;
    }

    if (!cached) {
      // if cache is full, remove the oldest entry to make room for the new one
      const keys = Array.from(profileCache.keys());
      if (keys.length >= maxCachedProfiles) {
        const cachedItemToRemove = profileCache.get(keys[0]);
        // The deferred has almost certainly long been resolved, but just in case
        // it's still pending, we'll reject it.
        cachedItemToRemove.deferred.reject({
          errCode: 'CACHE_FULL',
          error: 'Entry removed because cache was full.',
        });
        profileCache.delete(keys[0]);
      }

      const deferred = $.Deferred();
      profileCache.set(id, {
        deferred,
        createdAt: Date.now(),
      });
      profilesToFetch.push(id);
    }

    const promise = profileCache.get(id).deferred.promise();

    promise.fail(() => {
      // If the promise fails for any reason, remove it from the cache.
      profileCache.delete(id);
    });

    promises.push(promise);
  });

  if (profilesToFetch.length) {
    const fetchId = guid();
    socket = getSocket();

    if (!socket) {
      promises.forEach((promise) => {
        promise.reject({
          errCode: 'NO_SERVER_CONNECTION',
          error: 'There is no server connection.',
        });
      });
    } else {
      const onSocketMessage = (e) => {
        if (!(e.jsonData.peerID && (e.jsonData.profile || e.jsonData.error))) return;
        if (e.jsonData.id !== fetchId) return;

        if (profileCache.get(e.jsonData.peerID)) {
          if (e.jsonData.error) {
            profileCache.get(e.jsonData.peerID)
              .deferred
              .reject({
                errCode: 'SERVER_ERROR',
                error: e.jsonData.error,
              });
          } else {
            profileCache.get(e.jsonData.peerID)
              .deferred
              .resolve(new Profile(e.jsonData.profile, { parse: true }));
          }

          if (profilesReceived.indexOf(e.jsonData.peerID) === -1) {
            profilesReceived.push(e.jsonData.peerID);
          }

          if (profilesReceived.length === profilesToFetch.length) {
            socket.off('message', onSocketMessage);
          }
        }
      };

      socket.on('message', onSocketMessage);

      myPost(app.getServerUrl(`ob/fetchprofiles?async=true&usecache=true&asyncID=${fetchId}`), profilesToFetch)
      .fail((jqXhr) => {
        socket.off('message', onSocketMessage);
        promises.forEach((promise) => {
          promise.reject({
            errCode: 'SERVER_ERROR',
            error: (jqXhr.responseJSON && jqXhr.responseJSON.reason) || '',
          });
        });
      });
    }
  }

  return promises;
}
