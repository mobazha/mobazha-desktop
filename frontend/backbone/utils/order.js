import $ from 'jquery';
import { Events } from 'backbone';
import app from '../app.js';
import { myPost } from '../../src/api/api.js';
import OrderFulfillment from '../models/order/orderFulfillment/OrderFulfillment.js';
import OrderCompletion from '../models/order/orderCompletion/OrderCompletion.js';
import OrderDispute from '../models/order/OrderDispute.js';
import ResolveDispute from '../models/order/ResolveDispute.js';
import { ElMessage } from 'element-plus';
import Rating from '../models/order/orderCompletion/Rating';
import { getNetworkTypeByTokenId } from '../../src/config/token.js';

const events = {
  ...Events,
};

const acceptPosts = {};
const rejectPosts = {};
const cancelPosts = {};
const fulfillPosts = {};
const refundPosts = {};
const completePosts = {};
const openDisputePosts = {};
const resolvePosts = {};
const acceptPayoutPosts = {};
const releaseEscrowPosts = {};

function isStripeChain(paymentCoin) {
  return paymentCoin && paymentCoin.toUpperCase().startsWith('STRIPE');
}

/**
 * 通用的钱包连接检查函数
 * @param {Function} callback - 回调函数，参数为 (isConnected, walletAddress, networkType)
 * @param {string} requiredNetworkType - 需要的网络类型 ('ethereum', 'solana', 等)
 * @returns {Promise} Promise对象
 */
function checkWalletConnection(resultCallback, paymentCoin = null) {
  // 根据支付币种确定需要的网络类型
  const requiredNetworkType = getNetworkTypeByTokenId(paymentCoin);
  return new Promise((resolve, reject) => {
    events.trigger('checkWalletConnection', {
      callback: async (isConnected, walletAddress, currentNetworkType) => {
        if (!isConnected) {
          events.trigger('showWalletConnectMessage', {
            message: '请先连接钱包',
            type: 'warning'
          });
          reject(new Error('Please connect your wallet first'));
          return;
        }

        if (!walletAddress) {
          reject(new Error('Wallet address not found'));
          return;
        }

        // 检查网络类型是否匹配
        if (requiredNetworkType && currentNetworkType !== requiredNetworkType) {
          events.trigger('showWalletConnectMessage', {
            message: `请切换到${requiredNetworkType}网络，当前网络为${currentNetworkType}`,
            type: 'warning'
          });
          reject(new Error(`Please switch to ${requiredNetworkType} network, current network is ${currentNetworkType}`));
          return;
        }

        try {
          await resultCallback(isConnected, walletAddress, currentNetworkType);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      requiredNetworkType
    });
  });
}

/**
 * 通用的加密货币交易处理函数
 * @param {Object} params - 参数对象
 * @param {string} params.orderID - 订单ID
 * @param {string} params.networkType - 网络类型
 * @param {Object} params.instructions - 交易指令
 * @param {Object} params.metadata - 元数据
 * @param {Function} params.onSuccess - 成功回调
 * @param {Function} params.onError - 错误回调
 */
function handleCryptoTransaction({ orderID, networkType, instructions, metadata, onSuccess, onError }) {
  events.trigger('executeCryptoTransaction', {
    networkType,
    orderID,
    transactionData: instructions,
    metadata
  });

  const handleTransactionComplete = (e) => {
    if (e.orderID === orderID && e.networkType === networkType) {
      events.off('cryptoTransactionComplete', handleTransactionComplete);
      events.off('cryptoTransactionError', handleTransactionError);
      onSuccess(e.result);
    }
  };

  const handleTransactionError = (e) => {
    if (e.orderID === orderID && e.networkType === networkType) {
      events.off('cryptoTransactionComplete', handleTransactionComplete);
      events.off('cryptoTransactionError', handleTransactionError);
      let errorMessage = e.error?.message || '交易失败';
      if (errorMessage.includes('Error Number: 3012')) {
        errorMessage = 'Insufficient balance or token not found';
      }
      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 3000
      });
      onError(e.error);
    }
  };

  // 绑定事件监听器
  events.on('cryptoTransactionComplete', handleTransactionComplete);
  events.on('cryptoTransactionError', handleTransactionError);
}

/**
 * 高级通用函数：处理完整的订单操作流程
 * @param {Object} params - 参数对象
 * @param {string} params.orderID - 订单ID
 * @param {string} params.paymentCoin - 支付币种
 * @param {string} params.instructionsUrl - 指令接口URL
 * @param {string} params.actionUrl - 执行接口URL
 * @param {Object} params.instructionData - 指令请求数据
 * @param {Object} params.actionData - 执行请求数据
 * @param {Function} params.onSuccess - 成功回调
 * @param {Function} params.onError - 错误回调
 * @returns {Promise} Promise对象
 */
async function handleOrderOperation({ 
  orderID, 
  paymentCoin = null,
  instructionsUrl, 
  actionUrl, 
  instructionData = {}, 
  actionData = {},
  onSuccess,
  onError
}) {
  try {
    await checkWalletConnection(async (isConnected, walletAddress, currentNetworkType) => {
      // 构建指令请求数据
      const requestData = {
        orderID,
        initiatorAddress: walletAddress,
        ...instructionData
      };

      // 调用指令接口
      const response = await myPost(app.getServerUrl(instructionsUrl), requestData);

      if (response && response.hasInstructions === false) {
        // 没有指令，直接调用执行接口
        const result = await myPost(app.getServerUrl(actionUrl), actionData);
        onSuccess(result);
      } else if (response && response.instructions) {
        // 有指令，执行加密货币交易
        const networkType = getNetworkTypeByTokenId(response.paymentChain);
        
        handleCryptoTransaction({
          orderID,
          networkType,
          instructions: response.instructions,
          metadata: response,
          onSuccess: (transactionResult) => {
            // 交易成功后，调用actionUrl
            const finalActionData = {
              ...actionData,
              transactionID: transactionResult
            };
            
            myPost(app.getServerUrl(actionUrl), finalActionData)
              .then(onSuccess)
              .catch(error => {
                ElMessage({
                  message: error?.message || '操作失败',
                  type: 'error',
                  duration: 3000
                });
                onError(error);
              });
          },
          onError: onError
        });
      }
    }, paymentCoin);
  } catch (error) {
    onError(error);
  }
}

function confirmStripeOrder(orderID, reject = false) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let post = acceptPosts[orderID];

  if (reject) {
    post = rejectPosts[orderID];
  }

  if (!post) {
    post = myPost(app.getServerUrl('order/confirm'), {
      orderID,
      reject,
      transactionID: ""
    }).always(() => {
      if (reject) {
        delete rejectPosts[orderID];
      } else {
        delete acceptPosts[orderID];
      }
    }).done(() => {
      events.trigger(`${reject ? 'reject' : 'accept'}OrderComplete`, {
        id: orderID,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger(`${reject ? 'reject' : 'accept'}OrderFail`, {
        id: orderID,
        xhr: post,
      });

      ElMessage({
        message: {
          header: app.polyglot.t(`orderUtil.failed${reject ? 'Reject' : 'Accept'}Heading`),
          content: xhr.responseJSON && xhr.responseJSON.reason || ''
        },
        type: 'error',
        duration: 3000
      });
    });

    if (reject) {
      rejectPosts[orderID] = post;
    } else {
      acceptPosts[orderID] = post;
    }

    events.trigger(`${reject ? 'rejecting' : 'accepting'}Order`, {
      id: orderID,
      xhr: post,
    });
  }

  return post;
}

function confirmOrder(orderID, payoutAddress, toReject, paymentCoin = null) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let confirmRequest = acceptPosts[orderID];
  if (toReject) {
    confirmRequest = rejectPosts[orderID];
  }

  if (!confirmRequest) {
    const promise = new Promise(async (resolve, reject) => {
      await handleOrderOperation({
        orderID,
        paymentCoin,
        instructionsUrl: 'instructions/order/confirm',
        actionUrl: 'order/confirm',
        instructionData: { reject: toReject, payoutAddress },
        actionData: {
          orderID,
          reject: toReject,
          transactionID: "",
          payoutAddress
        },
        onSuccess: resolve,
        onError: reject
      });
    });

    // 将Promise包装成jQuery的Promise对象
    const jqPromise = $.Deferred();
    promise
      .then(result => {
        jqPromise.resolve(result);
        events.trigger(`${toReject ? 'reject' : 'accept'}OrderComplete`, {
          id: orderID,
          xhr: jqPromise
        });
      })
      .catch(error => {
        jqPromise.reject(error);
        events.trigger(`${toReject ? 'reject' : 'accept'}OrderFail`, {
          id: orderID,
          xhr: jqPromise
        });

        ElMessage({
          message: {
            header: app.polyglot.t(`orderUtil.failed${toReject ? 'Reject' : 'Accept'}Heading`),
            content: error.message || ''
          },
          type: 'error',
          duration: 3000
        });
      })
      .finally(() => {
        if (toReject) {
          delete rejectPosts[orderID];
        } else {
          delete acceptPosts[orderID];
        }
      });

    if (toReject) {
      rejectPosts[orderID] = jqPromise;
    } else {
      acceptPosts[orderID] = jqPromise;
    }

    events.trigger(`${toReject ? 'rejecting' : 'accepting'}Order`, {
      id: orderID,
      xhr: jqPromise
    });

    return jqPromise;
  }

  return confirmRequest;
}

export { events };

export function acceptingOrder(orderID) {
  return !!acceptPosts[orderID];
}

export function acceptOrder(orderID, payoutAddress, paymentCoin) {
  if (isStripeChain(paymentCoin)) {
    return confirmStripeOrder(orderID, false);
  }
  return confirmOrder(orderID, payoutAddress, false, paymentCoin);
}

export function rejectingOrder(orderID) {
  return !!rejectPosts[orderID];
}

export function rejectOrder(orderID, paymentCoin) {
  if (isStripeChain(paymentCoin)) {
    return confirmStripeOrder(orderID, true);
  }
  return confirmOrder(orderID, null, true, paymentCoin);
}

export function cancelingOrder(orderID) {
  return !!cancelPosts[orderID];
}

export function cancelOrder(orderID, paymentCoin) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (cancelPosts[orderID]) {
    return cancelPosts[orderID];
  }

  const promise = new Promise(async (resolve, reject) => {
    await handleOrderOperation({
      orderID,
      paymentCoin,
      instructionsUrl: 'instructions/order/cancel',
      actionUrl: 'order/cancel',
      instructionData: {},
      actionData: { orderID },
      onSuccess: resolve,
      onError: reject
    });
  });

  const jqPromise = $.Deferred();
  promise
    .then(result => {
      jqPromise.resolve(result);
      events.trigger('cancelOrderComplete', {
        id: orderID,
        xhr: jqPromise,
      });
    })
    .catch(error => {
      jqPromise.reject(error);
      events.trigger('cancelOrderFail', {
        id: orderID,
        xhr: jqPromise,
      });

      ElMessage({
        message: {
          header: app.polyglot.t('orderUtil.failedCancelHeading'),
          content: error?.message || ''
        },
        type: 'error',
        duration: 3000
      });
    })
    .finally(() => {
      delete cancelPosts[orderID];
    });

  cancelPosts[orderID] = jqPromise;
  events.trigger('cancelingOrder', {
    id: orderID,
    xhr: jqPromise,
  });

  return jqPromise;
}

export function fulfillingOrder(orderID) {
  return !!fulfillPosts[orderID];
}

export function fulfillOrder(contractType = 'PHYSICAL_GOOD', isLocalPickup = false, data = {}) {
  if (!data || !data.orderID) {
    throw new Error('An orderID must be provided with the data.');
  }

  const { orderID } = data;

  let post = fulfillPosts[orderID];

  if (!post) {
    const model = new OrderFulfillment(data, { contractType, isLocalPickup });
    post = model.save();

    if (!post) {
      Object.keys(model.validationError)
        .forEach((errorKey) => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      post.always(() => {
        delete fulfillPosts[orderID];
      }).done(() => {
        events.trigger('fulfillOrderComplete', {
          id: orderID,
          xhr: post,
        });
      })
        .fail((xhr) => {
          events.trigger('fulfillOrderFail', {
            id: orderID,
            xhr: post,
          });

          ElMessage({
            message: {
              header: app.polyglot.t('orderUtil.failedFulfillHeading'),
              content: xhr.responseJSON && xhr.responseJSON.reason || ''
            },
            type: 'error',
            duration: 3000
          });
        });

      fulfillPosts[orderID] = post;
      events.trigger('fulfillingOrder', {
        id: orderID,
        xhr: post,
      });
    }
  }

  return post;
}

export function refundingOrder(orderID) {
  return !!refundPosts[orderID];
}

export function refundOrder(orderID, paymentCoin = null) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (refundPosts[orderID]) {
    return refundPosts[orderID].xhr;
  }

  // 创建一个新的Promise来处理整个流程
  const promise = new Promise(async (resolve, reject) => {
    await handleOrderOperation({
      orderID,
      paymentCoin,
      instructionsUrl: 'instructions/order/refund',
      actionUrl: 'order/refund',
      instructionData: {},
      actionData: { orderID },
      onSuccess: resolve,
      onError: reject
    });
  });

  // 将Promise包装成jQuery的Promise对象
  const jqPromise = $.Deferred();
  promise
    .then(result => {
      jqPromise.resolve(result);
      events.trigger('refundOrderComplete', {
        id: orderID,
        xhr: jqPromise
      });
    })
    .catch(error => {
      jqPromise.reject(error);
      events.trigger('refundOrderFail', {
        id: orderID,
        xhr: jqPromise
      });

      ElMessage({
        message: {
          header: app.polyglot.t('orderUtil.failedRefundHeading'),
          content: error.message || ''
        },
        type: 'error',
        duration: 3000
      });
    })
    .finally(() => {
      delete refundPosts[orderID];
    });

  refundPosts[orderID] = { xhr: jqPromise };

  events.trigger('refundingOrder', {
    id: orderID,
    xhr: jqPromise
  });

  return jqPromise;
}

/**
 * If the order with the given id is in the process of being completed, this method
 * will return an object containing the post xhr and the data that's being saved.
 */
export function completingOrder(orderID) {
  return !!completePosts[orderID];
}

export function completeStripeOrder(orderID, data = {}) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (!completePosts[orderID]) {
    const model = new OrderCompletion(data);
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach(errorKey => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete completePosts[orderID];
      }).done(() => {
        events.trigger('completeOrderComplete', {
          id: orderID,
          xhr: save,
        });
      })
      .fail(xhr => {
        events.trigger('completeOrderFail', {
          id: orderID,
          xhr: save,
        });

        ElMessage({
          message: {
            header: app.polyglot.t('orderUtil.failedCompleteHeading'),
            content: xhr.responseJSON && xhr.responseJSON.reason || ''
          },
          type: 'error',
          duration: 3000
        });
      });

      completePosts[orderID] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('completingOrder', {
      id: orderID,
      xhr: save,
    });
  }

  return completePosts[orderID].xhr;
}

export function completeOrder(orderID, data = {}, paymentCoin) {
  console.log('completeOrder', orderID, data, paymentCoin);
  if (isStripeChain(paymentCoin)) {
    return completeStripeOrder(orderID, data);
  }
  return completeCryptoOrder(orderID, data);
}

function completeCryptoOrder(orderID, data = {}) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (completePosts[orderID]) {
    return completePosts[orderID].xhr;
  }

  const validateRatings = (ratings) => {
    if (!ratings) return true;
    if (typeof ratings !== 'object') return false;
    if (ratings.overall && (typeof ratings.overall !== 'number' || ratings.overall < 1 || ratings.overall > 5)) return false;
    if (ratings.quality && (typeof ratings.quality !== 'number' || ratings.quality < 1 || ratings.quality > 5)) return false;
    if (ratings.description && (typeof ratings.description !== 'number' || ratings.description < 1 || ratings.description > 5)) return false;
    if (ratings.customerService && (typeof ratings.customerService !== 'number' || ratings.customerService < 1 || ratings.customerService > 5)) return false;
    if (ratings.delivery && (typeof ratings.delivery !== 'number' || ratings.delivery < 1 || ratings.delivery > 5)) return false;
    return true;
  };

  if (!validateRatings(data.ratings)) {
    throw new Error('Invalid ratings data');
  }

  const promise = new Promise(async (resolve, reject) => {
    await handleOrderOperation({
      orderID,
      paymentCoin: data.paymentCoin,
      instructionsUrl: 'instructions/order/complete',
      actionUrl: 'order/complete',
      instructionData: data,
      actionData: {
        orderID,
        ...data,
        transactionID: ""
      },
      onSuccess: resolve,
      onError: reject
    });
  });

  // 将Promise包装成jQuery的Promise对象
  const jqPromise = $.Deferred();
  promise
    .then(result => {
      jqPromise.resolve(result);
      events.trigger('completeOrderComplete', {
        id: orderID,
        xhr: jqPromise
      });
    })
    .catch(error => {
      jqPromise.reject(error);
      events.trigger('completeOrderFail', {
        id: orderID,
        xhr: jqPromise
      });

      ElMessage({
        message: {
          header: app.polyglot.t('orderUtil.failedCompleteHeading'),
          content: error.message || ''
        },
        type: 'error',
        duration: 3000
      });
    })
    .finally(() => {
      delete completePosts[orderID];
    });

  completePosts[orderID] = { xhr: jqPromise, data };

  events.trigger('completingOrder', {
    id: orderID,
    xhr: jqPromise
  });

  return jqPromise;
}

/**
 * If the order with the given id is in the process of a dispute being opened,
 * this method will return an object containing the post xhr and the data
 * that's being saved.
 */
export function openingDispute(orderID) {
  return !!openDisputePosts[orderID];
}

export function openDispute(orderID, data = {}) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (!openDisputePosts[orderID]) {
    const model = new OrderDispute(data);
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach((errorKey) => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete openDisputePosts[orderID];
      }).done(() => {
        events.trigger('openDisputeComplete', {
          id: orderID,
          xhr: save,
        });
      })
        .fail((xhr) => {
          events.trigger('openDisputeFail', {
            id: orderID,
            xhr: save,
          });

          ElMessage({
            message: {
              header: app.polyglot.t('orderUtil.failedOpenDisputeHeading'),
              content: xhr.responseJSON && xhr.responseJSON.reason || ''
            },
            type: 'error',
            duration: 3000
          });
        });

      openDisputePosts[orderID] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('openingDisputeOrder', {
      id: orderID,
      xhr: save,
    });
  }

  return openDisputePosts[orderID].xhr;
}

/**
 * If the order with the given id is in the process of its dispute being resolved,
 * this method will return an object containing the post xhr and the data that's
 * being saved.
 */
export function resolvingDispute(orderID) {
  return !!resolvePosts[orderID];
}

export function resolveDispute(model) {
  if (!(model instanceof ResolveDispute)) {
    throw new Error('model must be provided as an instance of a ResolveDispute model.');
  }

  if (!model.id) {
    throw new Error('The model must have an id set.');
  }

  const orderID = model.id;

  if (!resolvePosts[orderID]) {
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach((errorKey) => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete resolvePosts[orderID];
      }).done(() => {
        events.trigger('resolveDisputeComplete', {
          id: orderID,
          xhr: save,
        });
      })
        .fail((xhr) => {
          events.trigger('resolveDisputeFail', {
            id: orderID,
            xhr: save,
          });

          ElMessage({
            message: {
              header: app.polyglot.t('orderUtil.failedResolveHeading'),
              content: xhr.responseJSON && xhr.responseJSON.reason || ''
            },
            type: 'error',
            duration: 3000
          });
        });

      resolvePosts[orderID] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('resolvingDispute', {
      id: orderID,
      xhr: save,
    });
  }

  return resolvePosts[orderID].xhr;
}

export function acceptingPayout(orderID) {
  return !!acceptPayoutPosts[orderID];
}

export function acceptPayout(orderID, paymentCoin = null) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (acceptPayoutPosts[orderID]) {
    return acceptPayoutPosts[orderID].xhr;
  }

  // 创建一个新的Promise来处理整个流程
  const promise = new Promise(async (resolve, reject) => {
    await handleOrderOperation({
      orderID,
      paymentCoin,
      instructionsUrl: 'instructions/dispute/release',
      actionUrl: 'dispute/release',
      instructionData: {},
      actionData: { orderID },
      onSuccess: resolve,
      onError: reject
    });
  });

  // 将Promise包装成jQuery的Promise对象
  const jqPromise = $.Deferred();
  promise
    .then(result => {
      jqPromise.resolve(result);
      events.trigger('acceptPayoutComplete', {
        id: orderID,
        xhr: jqPromise
      });
    })
    .catch(error => {
      jqPromise.reject(error);
      events.trigger('acceptPayoutFail', {
        id: orderID,
        xhr: jqPromise
      });

      ElMessage({
        message: {
          header: app.polyglot.t('orderUtil.failedAcceptPayoutHeading'),
          content: error.message || ''
        },
        type: 'error',
        duration: 3000
      });
    })
    .finally(() => {
      delete acceptPayoutPosts[orderID];
    });

  acceptPayoutPosts[orderID] = { xhr: jqPromise };

  events.trigger('acceptingPayout', {
    id: orderID,
    xhr: jqPromise
  });

  return jqPromise;
}

export function releasingEscrow(orderID) {
  return !!releaseEscrowPosts[orderID];
}

export function releaseEscrow(orderID) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let post = releaseEscrowPosts[orderID];

  if (!post) {
    post = myPost(app.getServerUrl('dispute/releaseAfterTimeout'), {
      orderID,
    }).always(() => {
      delete releaseEscrowPosts[orderID];
    }).done(() => {
      events.trigger('releaseEscrowComplete', {
        id: orderID,
        xhr: post,
      });
    })
      .fail((xhr) => {
        events.trigger('releaseEscrowFail', {
          id: orderID,
          xhr: post,
        });

        ElMessage({
          message: {
            header: app.polyglot.t('orderUtil.failedReleaseEscrowHeading'),
            content: xhr.responseJSON && xhr.responseJSON.reason || ''
          },
          type: 'error',
          duration: 3000
        });
      });

    releaseEscrowPosts[orderID] = post;
    events.trigger('releasingEscrow', {
      id: orderID,
      xhr: post,
    });
  }

  return post;
}
