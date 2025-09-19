<template>
  <div class="socialBtns">
    <div :class="ob.stripClasses">
      <a :class="`btn ${ob.btnClasses}`" @click="onClickMessage">{{ ob.polyT('userPage.message') }}</a>
      <ProcessingButton
        :className="`btn ${ob.btnClasses} ${ob.isFollowing ? 'processing' : ''}`"
        @click="onClickFollow"
        :btnText="ob.following ? ob.polyT('follow.unfollowBtn') : ob.polyT('follow.followBtn')"
      />
      <div class="js-blockBtnContainer">
        <BlockBtn :options="{ targetID: options.targetID }" />
      </div>
    </div>
  </div>
</template>

<script>
import app from '../../../backbone/app';
import { followedByYou, followUnfollow } from '../../../backbone/utils/follow';
import { recordEvent } from '../../../backbone/utils/metrics';
import { useChatStore } from '@/stores/chat';

export default {
  props: {
    options: {
      type: Object,
      default: {
        targetID: '',
      },
    },
  },
  data() {
    return {
      _state: {
        following: false,
        isFollowing: false,
        stripClasses: 'btnStrip clrSh3',
        btnClasses: 'clrP clrBr',
      }
    };
  },
  created() {
    this.initEventChain();

    this.loadData(this.options);
  },
  mounted() {
  },
  computed: {
    ob () {
      return {
        ...this.templateHelpers,
        ...this.options,
        ...this._state,
      };
    },
  },
  setup() {
    const chatStore = useChatStore();
    return {
      chatStore
    };
  },
  methods: {
    loadData(options = {}) {
      if (!options.targetID) throw new Error('You must provide a targetID');

      const opts = {
        ...options,
        initialState: {
          following: followedByYou(options.targetID),
          isFollowing: false,
          stripClasses: 'btnStrip clrSh3',
          btnClasses: 'clrP clrBr',
          ...(options.initialState || {}),
        },
      };

      this.baseInit(opts);
      this.listenTo(app.ownFollowing, 'update', () => {
        this.setState({
          following: followedByYou(options.targetID),
        });
      });
    },

    className() {
      return 'socialBtns';
    },

    onClickMessage() {
      // 使用新的Vue聊天系统
      if (window.vueApp && window.vueApp.$chat) {
        // 先打开聊天窗口
        window.vueApp.$chat.open();
      }
      
      // 然后设置当前会话
      const conversation = {
        peerID: this.options.targetID,
        profile: null // 稍后会通过API获取
      };
      
      // 使用setCurrentConversationAndFetch来正确标记为已读
      this.chatStore.setCurrentConversationAndFetch(conversation);
      
      // 获取用户资料
      this.chatStore.fetchConversations();
      
      recordEvent('Social_OpenChat');
    },

    onClickFollow() {
      const type = this.getState().following ? 'unfollow' : 'follow';
      this.setState({ isFollowing: true });
      this.folCall = followUnfollow(this.options.targetID, type).always(() => {
        if (this.isRemoved()) return;
        this.setState({ isFollowing: false });
      });
      if (type === 'follow') {
        recordEvent('Social_Follow');
      } else {
        recordEvent('Social_Unfollow');
      }
    },
  },
};
</script>
<style lang="scss" scoped></style>
