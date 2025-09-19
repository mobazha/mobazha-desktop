<template>
  <div :class="`cryptoIcon crypto-icon ${className}`">
    <i class="crypto-icon__large"><img class="bkgImg" :src="coin1Icon" /></i>
    <i v-if="coin2Icon" class="crypto-icon__small"><img class="bkgImg" :src="coin2Icon" /></i>
  </div>
</template>

<script>
import { getCurrencyByCode } from '../../../backbone/data/walletCurrencies';
import app from '../../../backbone/app';

export default {
  props: {
    className: {
      type: String,
      default: '',
    },
    code: {
      type: String,
      default: '',
    },
    token: {
      type: String,
      default: '',
    },
    chain: {
      type: String,
      default: '',
    },
    isNative: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
    };
  },
  created() {},
  mounted() {},
  computed: {
    coin1Icon() {
      // 优先使用 token prop
      if (this.token) {
        return app.getImagePath(`/cryptoIcons/${this.token}-icon.png`);
      }
      // 使用 code prop 作为 fallback
      const coin = this.code ? this.code : 'default-coin';
      return app.getImagePath(`/cryptoIcons/${coin}-icon.png`);
    },
    coin2Icon() {
      if (this.isNative) {
        return '';
      }
      // 优先使用 chain prop
      if (this.chain) {
        return app.getImagePath(`/cryptoIcons/${this.chain}-icon.png`);
      }
      const coinData = getCurrencyByCode(this.code);
      if (!coinData || !coinData.chain) {
        return '';
      }
      return app.getImagePath(`/cryptoIcons/${coinData.chain}-icon.png`);
    },
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.crypto-icon {
  position: relative;
  font-size: initial;
  &__large {
    width: 100%;
    height: 100%;
    background-size: contain;
    display: inline-block;
    background-repeat: no-repeat;
    background-position: center;
  }
  &__small {
    position: absolute;
    right: -12%;
    bottom: -12%;
    width: 50%;
    height: 50%;
    background-size: contain;
    display: inline-block;
    background-repeat: no-repeat;
    background-position: center;
  }
}
.bkgImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
