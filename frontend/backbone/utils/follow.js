import { myGet, myAjax } from '../../src/api/api';
import { capitalize } from './string';
import app from '../app';
import Dialog from '../views/modals/Dialog';

export function followedByYou(guid) {
  return !!app.ownFollowing.get(guid);
}

export function followsYou(guid) {
  if (!guid) {
    throw new Error('Please provide a guid');
  }

  return myGet(`${app.getServerUrl(`ob/followsme/${guid}`)}`);
}

export function followUnfollow(guid, type = 'follow') {
  if (typeof guid !== 'string') {
    throw new Error('You must provide a valid guid.');
  }

  const types = ['follow', 'unfollow'];
  if (types.indexOf(type) === -1) {
    throw new Error(`type must be one of ${types.join(', ')}`);
  }

  if (guid === app.profile.id) {
    throw new Error('You can not follow or unfollow your own guid');
  }

  return myAjax({
    type: 'POST',
    url: app.getServerUrl(`ob/${type}/${guid}`),
  })
    .done(() => {
      // if the call succeeds, add or remove the guid from the collection
      if (type === 'follow') {
        app.ownFollowing.unshift({ peerID: guid });
      } else {
        app.ownFollowing.remove(guid);
      }
    })
    .fail((data) => {
      new Dialog({
        title: app.polyglot.t('follow.followErrorTitle', {
          type: app.polyglot.t(`follow.type${capitalize(type)}`),
          user: guid,
        }),
        message: (data.responseJSON && data.responseJSON.reason) || '',
      })
        .render()
        .open();
    });
}
