<template>
  <div class="detail-wrapper">
    <div class="template-name">{{ `${this.shippingOption.get('name')}: ${templateName}` }}</div>
    <div class="tips" v-if="formData.serviceType"><span class="tips-btn">{{ ob.polyT('settings.storeTab.shippingOptions.services.notice') }}</span>{{ serviceTypeTip }}</div>
    <table class="table" width="100%" border="1" cellpadding="0" cellspacing="0">
      <tr>
        <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.nameLabel') }}</th>
        <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.estimatedDeliveryLabel') }}</th>
        <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.weightRange') }}</th>
        <template v-if="formData.serviceType === 'FIRST_RENEWAL_FEE'">
          <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.firstWeightAndFee') }}</th>
          <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.renewalUnitWeightAndFee') }}</th>
        </template>
        <template v-else>
          <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.fee') }}</th>
        </template>
        <th>{{ ob.polyT('settings.storeTab.shippingOptions.services.registrationFee') }}</th>
      </tr>
      <tbody>
        <tr v-for="(item, index) in formData.services" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.estimatedDelivery }}</td>
          <td>{{ `${item.startWeight}g ~ ${item.endWeight}g` }}</td>
          <template v-if="formData.serviceType === 'FIRST_RENEWAL_FEE'">
            <td>{{ `${item.firstWeight}g / ${formatCurrency(item.firstFreight, currency)}` }}</td>
            <td>{{ `${item.renewalUnitWeight}g / ${formatCurrency(item.renewalUnitPrice, currency)}` }}</td>
          </template>
          <template v-else>
            <td>{{ formatCurrency(item.firstFreight, currency) }}</td>
          </template>
          <td>{{ formatCurrency(item.registrationFee, currency) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- <el-table :data="data.options" :border="true" scrollbar-always-on>
    <el-table-column label="服务" prop="service" show-overflow-tooltip />
    <el-table-column label="运送时间" prop="estimatedDelivery" show-overflow-tooltip />
    <el-table-column label="开始重量" prop="startWeight" show-overflow-tooltip />
    <el-table-column label="结束重量" prop="endWeight" show-overflow-tooltip />
    <el-table-column label="价格（首重）" prop="firstPrice" show-overflow-tooltip />
    <el-table-column label="首重运费" prop="firstFreight" show-overflow-tooltip />
    <el-table-column label="价格（续重）" prop="renewalFee" show-overflow-tooltip />
    <el-table-column label="单价" prop="renewalUnitPrice" show-overflow-tooltip />
    <el-table-column label="挂号费" prop="registrationFee" show-overflow-tooltip />
  </el-table> -->
</template>
<script>

import { formatCurrency } from '../../../../backbone/utils/currency';

export default {
  props: {
    bb: Function,
  },
  data() {
    return {
      formData: {
        serviceType: 'FIRST_RENEWAL_FEE',
        services: [],
      },
      options: [
        { label: app.polyglot.t('settings.storeTab.shippingOptions.services.firstRenewalTemplate'), value: 'FIRST_RENEWAL_FEE' },
        { label: app.polyglot.t('settings.storeTab.shippingOptions.services.sameWeightTemplate'), value: 'SAME_WEIGHT_SAME_FEE' },
      ],
      currency: ''
    };
  },
  created() {
    this.loadData();
  },
  computed: {
    templateName() {
      if (!this.formData.serviceType) return '';
      return this.options.find((item) => item.value === this.formData.serviceType)?.label ?? '';
    },
    serviceTypeTip() {
      if (this.formData.serviceType === 'FIRST_RENEWAL_FEE') {
        return app.polyglot.t('settings.storeTab.shippingOptions.services.firstRenewalExplanation');
      } else if (this.formData.serviceType === 'SAME_WEIGHT_SAME_FEE') {
        return app.polyglot.t('settings.storeTab.shippingOptions.services.sameWeightExplanation');
      }
      return '';
    },
  },
  methods: {
    formatCurrency,

    loadData() {
      if (!this.shippingOption) {
        throw new Error('Please provide a shippingOption model.');
      }

      this.initFormData();

      this.shippingOption.on('change', () => this.initFormData());
    },

    initFormData() {
      const optionData = this.shippingOption.toJSON();

      this.formData = {
        serviceType: optionData.serviceType,
        services: optionData.services,
      };

      this.currency = this.shippingOption.get('currency');
    },
  },
};
</script>
<style lang="scss" scoped>
.detail-wrapper {
  padding: 0 5px;
}
.template-name {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  font-weight: bold;
}
.tips {
  display: flex;
  align-items: center;
  color: #999;
  margin-bottom: 10px;
  &-btn {
    padding: 2px 14px;
    background: green;
    color: #fff;
    margin-right: 10px;
  }
}
.table {
  border-collapse: collapse;
  border: 1px solid #dadbdd;
  th {
    font-size: 13px;
  }
  th,
  td {
    padding: 5px 5px;
    text-align: left;
    box-sizing: border-box;
    text-align: center;
  }
  td {
    font-weight: 400;
    font-size: 12px;
  }
  .tb-bg {
    width: 140px;
    white-space: nowrap;
    padding: 5px 5px;
    background: #f2f3f7;
    font-size: 14px;
    font-weight: bold;
    border: 1px solid #dadbdd;
  }
  td {
    min-width: 60px;
  }
}
</style>
