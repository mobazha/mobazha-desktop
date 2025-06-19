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

function confirmOrder(orderID, reject) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let confirmRequest = acceptPosts[orderID];

  if (reject) {
    confirmRequest = rejectPosts[orderID];
  }

  if (!confirmRequest) {
    const promise = new Promise((resolve, reject) => {
      // 触发检查钱包连接状态的事件
      events.trigger('checkWalletConnection', {
        callback: async (isConnected, walletAddress) => {
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

          try {
            const requestData = {
              orderID,
              reject,
              initiatorAddress: walletAddress
            };

            const response = await myPost(app.getServerUrl('instructions/order/confirm'), requestData);

            if (response && response.hasInstructions === false) {
              // 如果没有指令，直接调用确认接口
              const result = await myPost(app.getServerUrl('order/confirm'), {
                orderID,
                reject,
                transactionID: ""
              });
              resolve(result);
            } else if (response && response.instructions) {
              if (response.paymentChain === 'ETH') {
                events.trigger('executeEthTransaction', {
                  txData: response.instructions,
                  orderID,
                  reject,
                  metadata: response
                });
              } else if (response.paymentChain === 'SOL' || response.paymentChain === 'SOLUSDT') {
                events.trigger('executeSolanaTransaction', {
                  instructions: response.instructions,
                  orderID,
                  reject,
                  metadata: response
                });
              } else {
                reject(new Error('暂不支持该链支付: ' + response.paymentChain));
                return;
              }

              const handleTransactionComplete = (e) => {
                if (e.orderID === orderID) {
                  events.off('ethTransactionComplete', handleTransactionComplete);
                  events.off('solanaTransactionComplete', handleTransactionComplete);
                  events.off('ethTransactionError', handleTransactionError);
                  events.off('solanaTransactionError', handleTransactionError);
                  
                  // 交易成功后，调用后端确认接口
                  myPost(app.getServerUrl('order/confirm'), {
                    orderID,
                    reject,
                    transactionID: e.result
                  })
                  .then(resolve)
                  .catch(error => {
                    ElMessage({
                      message: error?.message || '发送确认信息失败',
                      type: 'error',
                      duration: 3000
                    });
                    reject(error);
                  });
                }
              };

              const handleTransactionError = (e) => {
                if (e.orderID === orderID) {
                  events.off('ethTransactionComplete', handleTransactionComplete);
                  events.off('solanaTransactionComplete', handleTransactionComplete);
                  events.off('ethTransactionError', handleTransactionError);
                  events.off('solanaTransactionError', handleTransactionError);
                  let errorMessage = e.error?.message || '交易失败';
                  if (errorMessage.includes('Error Number: 3012')) {
                    errorMessage = 'Insufficient balance or token not found';
                  }
                  ElMessage({
                    message: errorMessage,
                    type: 'error',
                    duration: 3000
                  });
                  reject(e.error);
                }
              };

              // 绑定事件监听器
              events.on('ethTransactionComplete', handleTransactionComplete);
              events.on('solanaTransactionComplete', handleTransactionComplete);
              events.on('ethTransactionError', handleTransactionError);
              events.on('solanaTransactionError', handleTransactionError);
            }
          } catch (error) {
            reject(error);
          }
        }
      });
    });

    // 将Promise包装成jQuery的Promise对象
    const jqPromise = $.Deferred();
    promise
      .then(result => {
        jqPromise.resolve(result);
        events.trigger(`${reject ? 'reject' : 'accept'}OrderComplete`, {
          id: orderID,
          xhr: jqPromise
        });
      })
      .catch(error => {
        jqPromise.reject(error);
        events.trigger(`${reject ? 'reject' : 'accept'}OrderFail`, {
          id: orderID,
          xhr: jqPromise
        });

        ElMessage({
          message: {
            header: app.polyglot.t(`orderUtil.failed${reject ? 'Reject' : 'Accept'}Heading`),
            content: error.message || ''
          },
          type: 'error',
          duration: 3000
        });
      })
      .finally(() => {
        if (reject) {
          delete rejectPosts[orderID];
        } else {
          delete acceptPosts[orderID];
        }
      });

    if (reject) {
      rejectPosts[orderID] = jqPromise;
    } else {
      acceptPosts[orderID] = jqPromise;
    }

    events.trigger(`${reject ? 'rejecting' : 'accepting'}Order`, {
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

export function acceptOrder(orderID, paymentCoin) {
  if (isStripeChain(paymentCoin)) {
    return confirmStripeOrder(orderID, false);
  }
  return confirmOrder(orderID, false);
}

export function rejectingOrder(orderID) {
  return !!rejectPosts[orderID];
}

export function rejectOrder(orderID, paymentCoin) {
  if (isStripeChain(paymentCoin)) {
    return confirmStripeOrder(orderID, true);
  }
  return confirmOrder(orderID, true);
}

export function cancelingOrder(orderID) {
  return !!cancelPosts[orderID];
}

export function cancelOrder(orderID, paymentCoin) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let post = cancelPosts[orderID];

  if (!post) {
    post = myPost(app.getServerUrl('ob/ordercancel'), {
      orderID,
    }).always(() => {
      delete cancelPosts[orderID];
    }).done(() => {
      events.trigger('cancelOrderComplete', {
        id: orderID,
        xhr: post,
      });
    })
      .fail((xhr) => {
        events.trigger('cancelOrderFail', {
          id: orderID,
          xhr: post,
        });

        ElMessage({
          message: {
            header: app.polyglot.t('orderUtil.failedCancelHeading'),
            content: xhr.responseJSON && xhr.responseJSON.reason || ''
          },
          type: 'error',
          duration: 3000
        });
      });

    cancelPosts[orderID] = post;
    events.trigger('cancelingOrder', {
      id: orderID,
      xhr: post,
    });
  }

  return post;
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

export function refundOrder(orderID) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let post = refundPosts[orderID];

  if (!post) {
    post = myPost(app.getServerUrl('order/refund'), {
      orderID,
    }).always(() => {
      delete refundPosts[orderID];
    }).done(() => {
      events.trigger('refundOrderComplete', {
        id: orderID,
        xhr: post,
      });
    })
      .fail((xhr) => {
        events.trigger('refundOrderFail', {
          id: orderID,
          xhr: post,
        });

        ElMessage({
          message: {
            header: app.polyglot.t('orderUtil.failedRefundHeading'),
            content: xhr.responseJSON && xhr.responseJSON.reason || ''
          },
          type: 'error',
          duration: 3000
        });
      });

    refundPosts[orderID] = post;
    events.trigger('refundingOrder', {
      id: orderID,
      xhr: post,
    });
  }

  return post;
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

  const promise = new Promise((resolve, reject) => {
    // 触发检查钱包连接状态的事件
    events.trigger('checkWalletConnection', {
      callback: async (isConnected, walletAddress) => {
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

        try {
          // 先请求 instructions/order/complete
          const requestData = {
            orderID,
            initiatorAddress: walletAddress,
            ...data
          };

          const response = await myPost(app.getServerUrl('instructions/order/complete'), requestData);

          if (response && response.hasInstructions === false) {
            // 没有链上指令，直接调用order/complete
            const result = await myPost(app.getServerUrl('order/complete'), {
              orderID,
              ...data,
              transactionID: ""
            });
            resolve(result);
          } else if (response && response.instructions) {
            // 根据支付币种选择不同的处理方式
            if (response.paymentChain === 'ETH') {
              events.trigger('executeEthTransaction', {
                txData: response.instructions,
                orderID,
                metadata: response
              });
            } else if (response.paymentChain === 'SOL' || response.paymentChain === 'SOLUSDT') {
              events.trigger('executeSolanaTransaction', {
                instructions: response.instructions,
                orderID,
                metadata: response
              });
            } else {
              reject(new Error('暂不支持该链支付: ' + response.paymentChain));
              return;
            }

            // 等待交易完成
            const handleTransactionComplete = (e) => {
              if (e.orderID === orderID) {
                events.off('ethTransactionComplete', handleTransactionComplete);
                events.off('solanaTransactionComplete', handleTransactionComplete);
                events.off('ethTransactionError', handleTransactionError);
                events.off('solanaTransactionError', handleTransactionError);
                
                // 交易成功后，调用后端完成接口
                myPost(app.getServerUrl('order/complete'), {
                  orderID,
                  ...data,
                  transactionID: e.result
                })
                .then(resolve)
                .catch(error => {
                  ElMessage({
                    message: error?.message || '发送完成信息失败',
                    type: 'error',
                    duration: 3000
                  });
                  reject(error);
                });
              }
            };

            const handleTransactionError = (e) => {
              if (e.orderID === orderID) {
                events.off('ethTransactionComplete', handleTransactionComplete);
                events.off('solanaTransactionComplete', handleTransactionComplete);
                events.off('ethTransactionError', handleTransactionError);
                events.off('solanaTransactionError', handleTransactionError);
                let errorMessage = e.error?.message || '交易失败';
                if (errorMessage.includes('Error Number: 3012')) {
                  errorMessage = 'Insufficient balance or token not found';
                }
                ElMessage({
                  message: errorMessage,
                  type: 'error',
                  duration: 3000
                });
                reject(e.error);
              }
            };

            // 绑定事件监听器
            events.on('ethTransactionComplete', handleTransactionComplete);
            events.on('solanaTransactionComplete', handleTransactionComplete);
            events.on('ethTransactionError', handleTransactionError);
            events.on('solanaTransactionError', handleTransactionError);
          }
        } catch (error) {
          reject(error);
        }
      }
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

export function acceptPayout(orderID) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  if (acceptPayoutPosts[orderID]) {
    return acceptPayoutPosts[orderID].xhr;
  }

  // 创建一个新的Promise来处理整个流程
  const promise = new Promise((resolve, reject) => {
    // 触发检查钱包连接状态的事件
    events.trigger('checkWalletConnection', {
      callback: async (isConnected, walletAddress) => {
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

        try {
          const requestData = {
            orderID,
            initiatorAddress: walletAddress
          };
          
          const response = await myPost(app.getServerUrl('instructions/dispute/release'), requestData);
          
          if (response && response.hasInstructions === false) {
            const result = await myPost(app.getServerUrl('dispute/release'), {
              orderID
            });
            resolve(result);
          } else if (response && response.instructions) {
            // 根据支付币种选择不同的处理方式
            if (response.paymentChain === 'ETH') {
              events.trigger('executeEthTransaction', {
                txData: response.instructions,
                orderID,
                metadata: response
              });
            } else if (response.paymentChain === 'SOL' || response.paymentChain === 'SOLUSDT') {
              events.trigger('executeSolanaTransaction', {
                instructions: response.instructions,
                orderID,
                metadata: response
              });
            } else {
              reject(new Error('暂不支持该链支付: ' + response.paymentChain));
              return;
            }

            // 等待交易完成
            const handleTransactionComplete = (e) => {
              if (e.orderID === orderID) {
                events.off('ethTransactionComplete', handleTransactionComplete);
                events.off('solanaTransactionComplete', handleTransactionComplete);
                events.off('ethTransactionError', handleTransactionError);
                events.off('solanaTransactionError', handleTransactionError);
                
                // 交易成功后，调用dispute/release
                myPost(app.getServerUrl('dispute/release'), {
                  orderID,
                  transactionID: e.result
                })
                .then(resolve)
                .catch(error => {
                  ElMessage({
                    message: error?.message || '发送支付信息失败',
                    type: 'error',
                    duration: 3000
                  });
                  reject(error);
                });
              }
            };

            const handleTransactionError = (e) => {
              if (e.orderID === orderID) {
                events.off('ethTransactionComplete', handleTransactionComplete);
                events.off('solanaTransactionComplete', handleTransactionComplete);
                events.off('ethTransactionError', handleTransactionError);
                events.off('solanaTransactionError', handleTransactionError);
                let errorMessage = e.error?.message || '交易失败';
                if (errorMessage.includes('Error Number: 3012')) {
                  errorMessage = 'Insufficient balance or token not found';
                }
                ElMessage({
                  message: errorMessage,
                  type: 'error',
                  duration: 3000
                });
                reject(e.error);
              }
            };

            // 绑定事件监听器
            events.on('ethTransactionComplete', handleTransactionComplete);
            events.on('solanaTransactionComplete', handleTransactionComplete);
            events.on('ethTransactionError', handleTransactionError);
            events.on('solanaTransactionError', handleTransactionError);
          }
        } catch (error) {
          reject(error);
        }
      }
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
