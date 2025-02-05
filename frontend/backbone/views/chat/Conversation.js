import $ from 'jquery';
import _ from 'underscore';
import 'velocity-animate';
import app from '../../app';
import { myPost, myAjax } from '../../../src/api/api';
import { getBody } from '../../utils/selectors';
import { getSocket } from '../../utils/serverConnect';
import { openSimpleMessage } from '../modals/SimpleMessage';
import { insertAtCursor } from '../../utils/dom';
import { block, isBlocking, events as blockEvents } from '../../utils/block';
import emojis from '../../data/emojis';
import { recordEvent } from '../../utils/metrics';
import loadTemplate from '../../utils/loadTemplate';
import ChatMessages from '../../collections/ChatMessages';
import ChatMessage from '../../models/chat/ChatMessage';
import Profile from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ConvoProfileHeader from './ConvoProfileHeader';
import ConvoMessages from './ConvoMessages';
import EmojiMenu from './EmojiMenu';
import { truncateImageFilename } from '../../utils/index';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.profile ||
      (!(options.profile instanceof Profile) &&
      !options.profile.then)) {
      throw new Error('Please provide a profile model or a promise that provides' +
        ' one when it resolves.');
    }

    if (!options.guid) {
      throw new Error('Please provide the peer ID of the person you are conversing with.');
    }

    if (options.orderID && options.orderID.length > ChatMessage.max.orderIDLength) {
      throw new Error(`The orderID cannot exceed ${ChatMessage.max.orderIDLength} characters`);
    }

    const opts = {
      orderID: '',
      ...options,
    };

    super(opts);

    this.options = opts;
    this._guid = this.options.guid;
    this._isOpen = false;
    this._isEmojiMenuOpen = false;
    this.orderID = '';
    this.showLoadMessagesError = false;
    this.fetching = false;
    this.fetchedAllMessages = false;
    this.ignoreScroll = false;
    this.imageUploads = [];

    if (options.profile instanceof Profile) {
      this.profile = this.options.profile;
    } else {
      options.profile.done(model => {
        this.profile = model;

        if (this.convoProfileHeader) {
          this.convoProfileHeader.setState({
            handle: model.get('handle'),
            avatarHashes: model.get('avatarHashes').toJSON(),
            location: model.get('location'),
          });
        }

        if (this.convoMessages) {
          this.convoMessages.setProfile(model);
          const handle = model.get('handle');

          if (handle) {
            this.setTypingIndicator(handle);
          }
        }
      });
    }

    this.messages = new ChatMessages([], { guid: this.guid });
    this.listenTo(this.messages, 'request', this.onMessagesRequest);
    this.listenTo(this.messages, 'sync', this.onMessagesSync);
    this.listenTo(this.messages, 'update', this.onMessagesUpdate);
    this.listenTo(this.messages, 'error', this.onMessagesFetchError);
    this.fetchMessages();

    const socket = getSocket();

    if (socket) {
      this.listenTo(socket, 'message', this.onSocketMessage);
    }

    this.boundOnFocusin = this.onFocusIn.bind(this);
    this.$el.on('focusin', this.boundOnFocusin);

    this.listenTo(blockEvents, 'blocking', data => {
      if (!data.peerIDs.includes(this.guid)) return;
      this.$el.addClass('isBlocking');
    });

    this.listenTo(blockEvents, 'blockFail blocked', data => {
      if (!data.peerIDs.includes(this.guid)) return;
      this.$el.removeClass('isBlocking');
    });
  }

  get messagesPerPage() {
    return 25;
  }

  className() {
    return 'chatConversation flexColRows clrP noMessages';
  }

  events() {
    return {
      click: 'onViewClick',
      'click .js-closeConvo': 'onClickCloseConvo',
      'click .js-subMenuTrigger': 'onClickSubMenuTrigger',
      'click .js-blockUser': 'onClickBlockUser',
      'click .js-subMenu a': 'onClickSubMenuLink',
      'click .js-retryLoadMessage': 'onClickRetryLoadMessage',
      'click .js-deleteConversation': 'onClickDeleteConvo',
      'keyup .js-inputMessage': 'onKeyUpMessageInput',
      'keydown .js-inputMessage': 'onKeyDownMessageInput',
      'blur .js-inputMessage': 'onBlurMessageInput',
      'click .js-emojiMenuTrigger': 'onClickEmojiMenuTrigger',

      'click .js-addImage': 'onClickAddImage',
      'change #inputImageUpload': 'onChangeImageUploadInput',
      'click .js-cancelImageUploads': 'onClickCancelImageUploads',
    };
  }

  onFocusIn() {
    if (this.markAsReadOnFocus) {
      this.markConvoAsRead();
      this.markAsReadOnFocus = false;
    }
  }

  onClickCloseConvo() {
    this.trigger('clickCloseConvo');
  }

  onClickSubMenuTrigger() {
    if (this.isSubmenuOpen()) {
      this.hideSubMenu();
    } else {
      this.showSubMenu();
    }

    return false; // don't bubble to onViewClick
  }

  onViewClick(e) {
    if (!$(e.target).closest('.js-subMenu').length) {
      this.hideSubMenu();
    }
  }

  onClickBlockUser() {
    recordEvent('Chat_BlockUser');
    block(this.guid);
  }

  onClickSubMenuLink() {
    this.hideSubMenu();
  }

  onMessagesRequest(mdCl, xhr) {
    // Only interested in the collection sync (not any of its models).
    if (!(mdCl instanceof ChatMessages)) return;

    this.showLoadMessagesError = false;
    this.$loadMessagesError.addClass('hide');
    this.$el.addClass('loadingMessages');
    this.fetching = true;

    xhr.always(() => (this.fetching = false));
  }

  onMessagesSync(mdCl, response) {
    // Only interested in the collection sync (not any of its models).
    if (!(mdCl instanceof ChatMessages)) return;

    this.showLoadMessagesError = false;
    this.$loadMessagesError.addClass('hide');
    this.$el.removeClass('loadingMessages');

    if (response && !response.length) {
      this.fetchedAllMessages = true;
    }

    if (!this.firstSyncComplete) {
      this.firstSyncComplete = true;
      this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);

      if (this.isOpen) {
        if (document.hasFocus()) {
          this.markConvoAsRead();
        } else {
          this.markAsReadOnFocus = true;
        }
      }
    }
  }

  onMessagesFetchError() {
    this.showLoadMessagesError = true;
    this.$loadMessagesError.removeClass('hide');
    this.$el.removeClass('loadingMessages');
  }

  onMessagesUpdate(cl, opts) {
    if (this.messages.length) {
      this.$el.removeClass('noMessages');
    }

    const prevTopModel = this.topRenderedMessageMd;

    if (!this.convoMessages) return;

    // As appropriate, update the scroll position.
    const prevScroll = {};

    prevScroll.height = this.$convoMessagesWindow[0].scrollHeight;
    prevScroll.top = this.$convoMessagesWindow[0].scrollTop;

    this.convoMessages.render();
    this.topRenderedMessageMd = this.messages.at(0);

    // Expecting either a new page of messages at the beginning of the collection or
    // a new single message at the end of the collection. In either of those scenarios
    // we'll adjust the scroll position as appopriate.

    if (opts.changes.added.length === 1) {
      // Single new message added.

      const newMessage = opts.changes.added[0];

      if (cl.indexOf(newMessage) === cl.length - 1) {
        // It's the last message.

        if (newMessage.get('outgoing')) {
          // It's our own message, so we'll auto scroll to the bottom.
          this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);
        } else if (prevScroll.top >=
          prevScroll.height - this.$convoMessagesWindow[0].clientHeight - 10) {
          // For an incoming message, if we were scrolled within 10px of the bottom at the
          // time the message came, we'll auto-scroll. Otherwise, we'll leave you where you were.
          this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);
        }
      }
    } else if (opts.changes.added.length &&
      cl.indexOf(opts.changes.added[opts.changes.added.length - 1]) !==
      prevTopModel) {
      // New page of messages added up top. We'll adjust the scroll position so there is no
      // jump as they are added in.
      this.setScrollTop(prevScroll.top +
        (this.$convoMessagesWindow[0].scrollHeight - prevScroll.height - 60));

      // the hardcode 60 is to account for the loading spinner that is going away
    }
  }

  onClickRetryLoadMessage() {
    this.fetchMessages(...this.lastFetchMessagesArgs);
  }

  onKeyDownMessageInput(e) {
    if (!e.shiftKey && e.which === 13) e.preventDefault();
  }

  /**
   * This handler should be called any time a chat message has been sent to the
   * server.
   */
  onMessageSent(chatMessage) {
    this.messages.push(chatMessage);
    this.trigger('newOutgoingMessage', { model: chatMessage });
  }

  sendMessage(msg, file = null) {
    if (!msg && !file) {
      throw new Error('Please provide a message or file to send.');
    }

    this.lastTypingSentAt = null;

    const chatMessage = new ChatMessage(file ? {
      peerID: this.guid,
      orderID: this.orderID,
      message: msg,
      file,
    } : {
      peerID: this.guid,
      orderID: this.orderID,
      message: msg,}, { parse: true });

    recordEvent('Chat_MessageSent');

    const save = chatMessage.save();

    if (save) {
      // At least for now, ignoring any server failures and optimistically adding the new
      // message to the UI. Odds are really low of server failure and repurcussions minimal.
      this.onMessageSent(chatMessage);
    } else {
      // Developer error - this shouldn't happen.
      console.error('There was an error saving the chat message.');
      console.dir(chatMessage.validationError);
    }
  }

  onKeyUpMessageInput(e) {
    // Send an empty message to indicate "typing...", but no more than 1 every
    // second.
    if (!this.lastTypingSentAt || (Date.now() - this.lastTypingSentAt) >= 1000) {
      const typingMessage = new ChatMessage({
        peerID: this.guid,
        orderID: this.orderID,
        message: '',
      });

      const saveTypingMessage = typingMessage.save();

      if (saveTypingMessage) {
        this.lastTypingSentAt = Date.now();
      } else {
        // Developer error - this shouldn't happen.
        console.error('There was an error saving the chat message.');
        console.dir(saveTypingMessage);
      }
    }

    // Send actual chat message if the Enter key was pressed
    if (e.shiftKey || e.which !== 13) return;

    const message = e.target.value.trim();
    if (message) this.sendMessage(message);
    $(e.target).val('');
  }

  onBlurMessageInput(e) {
    this.lastMessageInputCursorPos = e.target.selectionStart;
  }

  onScroll(e) {
    if (this.ignoreScroll) {
      this.ignoreScroll = false;
      this.throttleScrollHandler();
      return;
    }

    if (this.fetching || this.fetchedAllMessages
      || this.showLoadMessagesError) {
      return;
    }

    // If we come close enough to the top, let's fetch a new page.
    if (e.target.scrollTop <= 100) {
      this.fetchMessages(this.messages.at(0).id);
    }
  }

  onSocketMessage(e) {
    if (e.jsonData.chatMessage &&
      e.jsonData.chatMessage.orderID === this.orderID &&
      e.jsonData.chatMessage.peerID === this.guid) {
      // incoming chat message
      const message = new ChatMessage({
        ...e.jsonData.chatMessage,
        outgoing: false,
      });

      this.messages.push(message);

      if (this.isOpen) {
        if (document.hasFocus()) {
          this.markConvoAsRead();
        } else {
          this.markAsReadOnFocus = true;
        }
      }

      // We'll consider them to be done typing if an actual message came
      // in. If they re-start typing, we'll get another socket message.
      this.hideTypingIndicator();
    } else if (e.jsonData.messageTyping &&
      e.jsonData.messageTyping.orderID === this.orderID &&
      e.jsonData.messageTyping.peerID === this.guid) {
      // Conversant is typing...
      this.showTypingIndicator();
    } else if (e.jsonData.messageRead &&
      e.jsonData.messageRead.orderID === this.orderID &&
      e.jsonData.messageRead.peerID === this.guid) {
      // Conversant read your message
      if (this.convoMessages) {
        const model = this.messages.get(e.jsonData.messageRead.messageID);

        if (model) {
          model.set('read', true);
        }

        this.convoMessages.markMessageAsRead(e.jsonData.messageRead.messageID);
      }
    }
  }

  onClickDeleteConvo() {
    this.$el.addClass('isDeleting');

    const request = myAjax({
      url: app.getServerUrl(`ob/chatconversation/${this.guid}`),
      type: 'DELETE',
    }).fail((xhr) => {
      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('chat.conversation.deleteConvoErrorTitle'),
        failReason
      );
    }).always(() => this.$el.removeClass('isDeleting'));

    this.trigger('deleting', {
      request,
      guid: this.guid,
    });
  }

  onClickEmojiMenuTrigger() {
    if (this.isEmojiMenuOpen) {
      this.closeEmojiMenu();
    } else {
      this.openEmojiMenu();
    }
  }

  onEmojiSelected(e) {
    insertAtCursor(this.$messageInput[0], emojis[e.emoji].name);
    this.closeEmojiMenu();
    this.$messageInput.focus();
  }

  showTypingIndicator() {
    clearTimeout(this.typingTimeout);
    this.$el.addClass('isTyping');
    this.typingTimeout = setTimeout(
      () => (this.hideTypingIndicator()),
      3000);
  }

  hideTypingIndicator() {
    clearTimeout(this.typingTimeout);
    this.$el.removeClass('isTyping');
  }

  fetchMessages(offsetID, limit = this.messagesPerPage) {
    const params = { limit };

    this.lastFetchMessagesArgs = [offsetID, limit];
    if (offsetID) params.offsetID = offsetID;

    return this.messages.fetch({
      data: $.param(params),
      remove: false,
    });
  }

  setScrollTop(value, silent = true) {
    if (typeof value !== 'number') {
      throw new Error('Please provide a value as a number.');
    }

    if (this.$convoMessagesWindow[0].scrollTop === value) return;

    if (silent) {
      // Unthrottling the scroll handler so that our ignoreScoll flag won't
      // be lumped in with a user triggered scroll. The scroll handler will
      // reset the flag and re-throttle the handler.
      this.unthrottleScrollHandler();
      this.ignoreScroll = true;
    }

    this.$convoMessagesWindow[0].scrollTop = value;
  }

  unthrottleScrollHandler() {
    this.$convoMessagesWindow.off('scroll', this.boundScrollHandler);
    this.boundScrollHandler = this.onScroll.bind(this);
    this.$convoMessagesWindow.on('scroll', this.boundScrollHandler);
  }

  throttleScrollHandler() {
    this.$convoMessagesWindow.off('scroll', this.boundScrollHandler);
    this.boundScrollHandler = _.throttle(this.onScroll, 100).bind(this);
    this.$convoMessagesWindow.on('scroll', this.boundScrollHandler);
  }

  // Currently the convo is marked as read under the following scenarios.
  // - when this view is opened as long as the first batch of messages have already
  //   been fetched (don't want to mark as read if all the user has seen is
  //   a spinner)
  // - when the first batch of messages have been fetched as long as this view is open
  //   and the app is in focus.
  // - when this view (or a child element) gets focus as long as the messages would have
  //   otherwise been marked as read, but the call was held off because the app was
  //   not in focus.
  markConvoAsRead() {
    myPost(app.getServerUrl('ob/markchatasread'), {
      peerID: this.guid,
      orderID: this.orderID,
    });
    this.trigger('convoMarkedAsRead');
    this.markAsReadOnFocus = false;
  }

  get guid() {
    return this._guid;
  }

  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    getBody().addClass('chatConvoOpen');
    this.$messageInput.focus();

    if (this.firstSyncComplete) {
      this.markConvoAsRead();
    }
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    getBody().removeClass('chatConvoOpen');
  }

  get isOpen() {
    return this._isOpen;
  }

  isSubmenuOpen() {
    return !this.$subMenu.hasClass('hide');
  }

  showSubMenu() {
    this.$messagesOverlay.removeClass('hide');
    this.$subMenu.removeClass('hide');
  }

  hideSubMenu() {
    this.$messagesOverlay.addClass('hide');
    this.$subMenu.addClass('hide');
  }

  get isEmojiMenuOpen() {
    return this._isEmojiMenuOpen;
  }

  openEmojiMenu() {
    if (this._isEmojiMenuOpen) return;

    this._isEmojiMenuOpen = true;
    this.$emojiMenuContainer
      .velocity('stop')
      .velocity({
        top: [306, 416],
      });
  }

  closeEmojiMenu() {
    if (!this._isEmojiMenuOpen) return;

    this._isEmojiMenuOpen = false;
    this.$emojiMenuContainer
      .velocity('stop')
      .velocity({
        top: 416,
      }, {
        complete: () => {
          this.$emojiMenuContainer[0].scrollTop = 0;
        },
      });
  }

  onChangeImageUploadInput() {
    let imageFile = this.$inputImageUpload[0].files[0];

    this.$inputImageUpload.val('');

    this.$imageUploadingLabel.removeClass('hide');

    const fileReader = new FileReader();
    fileReader.readAsDataURL(imageFile);

    fileReader.onload = () => {
      const toUpload = {
        filename: truncateImageFilename(imageFile.name),
        image: fileReader.result.replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
        type: 'image',
      };
  
      this.uploadImage(toUpload);
    };

    fileReader.onerror = (error) => {
      openSimpleMessage( 'fail to read uploaded image', fileReader.error);
    };
  }

  uploadImage(file) {
    if (!file) {
      throw new Error('Please provide a image to upload.');
    }

    let filesToUpload = [file];

    const upload = myAjax({
      url: app.getServerUrl('ob/images'),
      type: 'POST',
      data: JSON.stringify(filesToUpload),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      if (this.isRemoved()) return;
      if (!this.inProgressImageUploads.length) this.$imageUploadingLabel.addClass('hide');
    }).done((uploadedFiles) => {
      if (this.isRemoved()) return;
      if (!uploadedFiles.length) return;

      const fileInChat = {filename: uploadedFiles[0].name, hash: uploadedFiles[0].hash, type: file.type};
      this.sendMessage('', fileInChat);
    })
      .fail((jqXhr) => {
        openSimpleMessage(
          app.polyglot.t(
            'editListing.errors.uploadImageErrorTitle',
            { smart_count: filesToUpload.length },
          ),
          jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
        );
      });

      this.imageUploads.push(upload);
  }

  get inProgressImageUploads() {
    return this.imageUploads
      .filter((upload) => upload.state() === 'pending');
  }

  onClickAddImage() {
    this.$inputImageUpload.trigger('click');
  }

  onClickCancelImageUploads() {
    this.inProgressImageUploads.forEach((imageUpload) => imageUpload.abort());
  }

  getTypingIndicatorContent() {
    let name = this.guid;

    if (this.profile) {
      const handle = this.profile.get('handle');
      if (handle) name = `@${handle}`;
    }

    const usernameHtml = `<span class="typingUsername noOverflow">${name}</span>`;
    return app.polyglot.t('chat.conversation.typingIndicator', { user: usernameHtml });
  }

  setTypingIndicator() {
    this.$typingIndicator.html(this.getTypingIndicatorContent());
  }

  get $typingIndicator() {
    return this._$typingIndicator ||
      (this._$typingIndicator = this.$('.js-typingIndicator'));
  }

  get $subMenu() {
    return this._$subMenu ||
      (this._$subMenu = this.$('.js-subMenu'));
  }

  get $messagesOverlay() {
    return this._$messagesOverlay ||
      (this._$messagesOverlay = this.$('.js-messagesOverlay'));
  }

  get $loadMessagesError() {
    let returnVal;

    if (this._$loadMessagesError && this._$loadMessagesError.length) {
      returnVal = this._$loadMessagesError;
    } else {
      returnVal = (this._$loadMessagesError = this.$('.js-loadMessagesError'));
    }

    return returnVal;
  }

  get $convoMessagesWindow() {
    return this._$convoMessagesWindow ||
      (this._$convoMessagesWindow = this.$('.js-convoMessagesWindow'));
  }

  get $emojiMenuContainer() {
    return this._$emojiMenuContainer ||
      (this._$emojiMenuContainer = this.$('.js-emojiMenuContainer'));
  }

  get $messageInput() {
    return this._$messageInput ||
      (this._$messageInput = this.$('.js-inputMessage'));
  }

  get $inputImageUpload() {
    return this._$inputImageUpload
      || (this._$inputImageUpload = this.$('#inputImageUpload'));
  }

  get $imageUploadingLabel() {
    return this._$imageUploadingLabel
      || (this._$imageUploadingLabel = this.$('.js-imageUploadingLabel'));
  }

  remove() {
    this.$el.off(null, this.boundOnFocusin);
    this.inProgressImageUploads.forEach((upload) => upload.abort());
    super.remove();
  }

  render() {
    loadTemplate('chat/conversation.html', (t) => {
      this.$el.html(t({
        guid: this.guid,
        profile: this.profile && this.profile.toJSON() || {},
        showLoadMessagesError: this.showLoadMessagesError,
        typingIndicator: this.getTypingIndicatorContent(),
        maxMessageLength: ChatMessage.max.messageLength,
        imageUploadInprogress: !!this.inProgressImageUploads.length,
      }));

      this._$subMenu = null;
      this._$messagesOverlay = null;
      this._$loadMessagesError = null;
      this._$convoMessagesWindow = null;
      this._$typingIndicator = null;
      this._$emojiMenuContainer = null;
      this._$messageInput = null;

      this._$inputImageUpload = null;
      this._$imageUploadingLabel = null;

      if (this.convoProfileHeader) this.convoProfileHeader.remove();

      const convoProfileHeaderInitialState = {
        guid: this.guid,
      };

      if (this.profile) {
        convoProfileHeaderInitialState.handle = this.profile.get('handle');
        convoProfileHeaderInitialState.avatarHashes = this.profile.get('avatarHashes').toJSON();
        convoProfileHeaderInitialState.location = this.profile.get('location');
      }

      this.convoProfileHeader = this.createChild(ConvoProfileHeader, {
        initialState: convoProfileHeaderInitialState,
      });

      this.$('.js-convoProfileHeaderContainer')
        .html(this.convoProfileHeader.render().el);

      if (this.emojiMenu) this.emojiMenu.remove();
      this.emojiMenu = this.createChild(EmojiMenu);
      this.listenTo(this.emojiMenu, 'emojiSelected', this.onEmojiSelected);

      this.$emojiMenuContainer.html(this.emojiMenu.render().el);

      if (this.ConvoMessages) this.ConvoMessages.remove();

      this.convoMessages = new ConvoMessages({
        collection: this.messages,
        $scrollContainer: this.$convoMessagesWindow,
        profile: this.profile,
      });

      this.$el.toggleClass('isBlocking', isBlocking(this.guid));
      this.$('.js-convoMessagesContainer').html(this.convoMessages.render().el);
      this.throttleScrollHandler();
    });

    return this;
  }
}
