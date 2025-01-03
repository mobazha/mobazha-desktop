<template>
  <div class="completeOrderForm rowLg">
    <h2 class="tx4 margRTn">{{ ob.polyT('orderDetail.summaryTab.completeOrderForm.heading') }}</h2>
    <div class="border clrBr padMd">
      <div class="flex gutterHLg">
        <div class="col9">
          <div class="flexVBase rowSm">
            <label class="txB tx5 required flexNoShrink" for="completeOrderReview">{{ ob.polyT('orderDetail.summaryTab.completeOrderForm.reviewLabel') }}</label>
            <div class="flexHRight">
              <span class="clrT2 tx6">{{ ob.polyT('orderDetail.summaryTab.completeOrderForm.maxReviewChars', { max: ob.constraints.maxReviewCharacters}) }}</span>
            </div>
          </div>
          <FormError v-if="ob.errors.review" :errors="ob.errors.review" />
          <textarea rows="8" name="review" class="clrBr clrP clrSh2 rowMd" id="completeOrderReview"
            placeholder="Write your review here…" :maxlength="ob.constraints.maxReviewCharacters" v-model="formData.review" />
          <div class="flexVCent gutterH">
            <ProcessingButton
              :className="`btn clrBAttGrad clrBrDec1 clrTOnEmph js-completeOrder ${isCompleting ? 'processing' : ''}`"
              :btnText="ob.polyT('orderDetail.summaryTab.completeOrderForm.btnCompleteOrder')"
              @click="onClickCompleteOrder" />
            <div class="gutterHSm">
              <FormError v-if="ob.errors.anonymous" :errors="ob.errors.anonymous" />
              <input type="checkbox" v-model="formData.nonAnonymous" id="completeOrderAnon" class="centerLabel" data-var-type="boolean">
              <label for="completeOrderAnon" class="clrT2 tx5b">{{ ob.polyT('orderDetail.summaryTab.completeOrderForm.anonCheckLabel') }}</label>
            </div>
          </div>
        </div>
        <div class="col3 ratingsCol">
          <div class="row">
            <div class="txB tx5">{{ ob.polyT('ratingLabels.overall') }}</div>
            <FormError v-if="ob.errors.overall" :errors="ob.errors.overall" />
            <RatingsStrip v-model:rating="ratingData.overall" :options="{ clickable: true, }" />
          </div>
          <div class="row">
            <div class="txB tx5">{{ ob.polyT('ratingLabels.quality') }}</div>
            <FormError v-if="ob.errors.quality" :errors="ob.errors.quality" />
            <RatingsStrip v-model:rating="ratingData.quality" :options="{ clickable: true, }" />
          </div>
          <div class="row">
            <div class="txB tx5">{{ ob.polyT('ratingLabels.asAdvertised') }}</div>
            <FormError v-if="ob.errors.description" :errors="ob.errors.description" />
            <RatingsStrip v-model:rating="ratingData.description" :options="{ clickable: true, }" />
          </div>
          <div class="row">
            <div class="txB tx5">{{ ob.polyT('ratingLabels.delivery') }}</div>
            <FormError v-if="ob.errors.deliverySpeed" :errors="ob.errors.deliverySpeed" />
            <RatingsStrip v-model:rating="ratingData.deliverySpeed" :options="{ clickable: true, }" />
          </div>
          <div class="row">
            <div class="txB tx5">{{ ob.polyT('ratingLabels.service') }}</div>
            <FormError v-if="ob.errors.customerService" :errors="ob.errors.customerService" />
            <RatingsStrip v-model:rating="ratingData.customerService" :options="{ clickable: true, }" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import $ from 'jquery';
import OrderCompletion from '../../../../../backbone/models/order/orderCompletion/OrderCompletion';
import {
  completeOrder,
  completingOrder,
  events as orderEvents,
} from '../../../../../backbone/utils/order';
import { recordEvent } from '../../../../../backbone/utils/metrics';
import Rating from '../../../../../backbone/models/order/orderCompletion/Rating';

import RatingsStrip from '../../../RatingsStrip.vue';

export default {
  components: {
    RatingsStrip,
  },
  props: {
    options: {
      type: Object,
      default: {},
    },
    bb: Function,
  },
  data () {
    return {
      _model: undefined,
      _modelKey: 0,

      rating: undefined,
      ratings: undefined,

      formData: {
        review: '',
        nonAnonymous: true,
      },
      // If a rating is not set, the RatingStrip view will return 0. We'll
      // send undefined in that case since it gives us the error message we
      // prefer.
      ratingData: {
        overall: undefined,
        quality: undefined,
        description: undefined,
        deliverySpeed: undefined,
        customerService: undefined,
      },
      isCompleting: false,
    };
  },
  created () {
    this.initEventChain();

    this.loadData(this.options);
  },
  mounted () {
  },
  computed: {
    ob () {
      return {
        ...this.templateHelpers,
        ...this.rating.toJSON(),
        errors: this.rating.validationError || {},
        constraints: this.rating.constraints || {},
      };
    },

    model() {
      let access = this._modelKey;

      return this._model;
    }
  },
  methods: {
    loadData (options = {}) {
      if (!options.orderID) {
        throw new Error('Please provide the orderID.');
      }

      if (!options.listings) {
        throw new Error('Please provide the listings.');
      }

      this.baseInit(options);

      const completingObject = completingOrder(this.orderID);
      this._model = new OrderCompletion(
        completingObject ? completingObject.data : { orderID: this.orderID },
      );
      this._model.on('change', () => this._modelKey += 1);

      this.ratingStrips = {};

      this.ratings = this._model.get('ratings');

      if (this.ratings.length) {
        this.rating = this.ratings.at(0);
      } else {
        this.rating = new Rating();
      }

      const ratingFields = [
        'overall',
        'quality',
        'description',
        'deliverySpeed',
        'customerService',
      ];
      ratingFields.forEach((type) => {
        this.ratingData[type] = this.rating.get(type);
      })

      this.isCompleting = !!completingOrder(this._model.id);
      this.listenTo(orderEvents, 'completingOrder', () => {
        this.isCompleting = true;
      });

      this.listenTo(orderEvents, 'completeOrderComplete completeOrderFail', () => {
        this.isCompleting = false;
      });
    },

    onClickCompleteOrder () {
      const data = {
        ...this.formData,
        anonymous: !this.formData.nonAnonymous,
        ...this.ratingData,
        slug: this.slug,
      };

      // Use the same ratings for all items from shopping cart
      this.ratings.reset();
      let hasError = false;
      this.listings.forEach(listing => {
        const rating = new Rating();
        data.slug = listing.slug;

        rating.set(data);
        rating.set(data, { validate: true });
        if (rating.validationError) {
          hasError = true;
        } else {
          this.ratings.push(rating);
        }
      })

      if (!hasError) {
        completeOrder(this.model.id, this.model.toJSON());
        recordEvent('OrderDetails_CompleteOrder');
      }

      const $firstErr = $('.errorList:first');
      if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
    },
  }
}
</script>
<style lang="scss" scoped></style>
