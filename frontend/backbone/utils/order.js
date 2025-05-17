
import $ from 'jquery';
import { Events } from 'backbone';
import app from '../app.js';
import { myPost } from '../../src/api/api.js';
import OrderFulfillment from '../models/order/orderFulfillment/OrderFulfillment.js';
import { openSimpleMessage } from '../views/modals/SimpleMessage.js';
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

function confirmOrder(orderID, reject = false) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  let confirmRequest = acceptPosts[orderID];

  if (reject) {
    confirmRequest = rejectPosts[orderID];
  }

  if (!confirmRequest) {
    // 触发检查钱包连接状态的事件
    events.trigger('checkWalletConnection', {
      callback: async (isConnected, walletAddress) => {
        if (!isConnected) {
          // 触发显示钱包连接提示的事件
          events.trigger('showWalletConnectMessage', {
            message: '请先连接钱包',
            type: 'warning'
          });
          throw new Error('Please connect your wallet first');
        }

        if (!walletAddress) {
          throw new Error('Wallet address not found');
        }

        // 调用后端接口获取SOL托管初始化指令
        const requestData = {
          orderID,
          reject,
          initiator: walletAddress
        };

        confirmRequest = myPost(app.getServerUrl('instructions/order/confirm'), requestData)
          .then(response => {
            if (response && response.hasInstructions === false) {
              // 如果没有指令，直接调用确认接口
              return myPost(app.getServerUrl('order/confirm'), {
                orderID,
                reject,
                transactionID: ""
              });
            } else if (response && response.instructions) {
              // 触发事件，让 Vue 组件处理交易
              events.trigger('executeSolanaTransaction', {
                instructions: response.instructions,
                orderID,
                reject,
              });
              
              // 返回一个 Promise，等待交易完成
              return new Promise((resolve, reject) => {
                const handleTransactionComplete = (e) => {
                  if (e.orderID === orderID) {
                    events.off('solanaTransactionComplete', handleTransactionComplete);
                    events.off('solanaTransactionError', handleTransactionError);
                    
                    // 交易成功后，调用后端确认接口
                    myPost(app.getServerUrl('order/confirm'), {
                      orderID,
                      reject,
                      transactionID: e.result
                    })
                    .then(resolve)
                    .catch(reject);
                  }
                };

                const handleTransactionError = (e) => {
                  if (e.orderID === orderID) {
                    console.log('Transaction error received:', e);
                    events.off('solanaTransactionComplete', handleTransactionComplete);
                    events.off('solanaTransactionError', handleTransactionError);
                    reject(e.error);
                  }
                };

                // 立即绑定事件监听器
                events.on('solanaTransactionComplete', handleTransactionComplete);
                events.on('solanaTransactionError', handleTransactionError);
              });
            }
            return response;
          })
          .always(() => {
            if (reject) {
              delete rejectPosts[orderID];
            } else {
              delete acceptPosts[orderID];
            }
          })
          .done(() => {
            events.trigger(`${reject ? 'reject' : 'accept'}OrderComplete`, {
              id: orderID,
              xhr: confirmRequest,
            });
          })
          .fail((xhr) => {
            events.trigger(`${reject ? 'reject' : 'accept'}OrderFail`, {
              id: orderID,
              xhr: confirmRequest,
            });
          });

        if (reject) {
          rejectPosts[orderID] = confirmRequest;
        } else {
          acceptPosts[orderID] = confirmRequest;
        }

        events.trigger(`${reject ? 'rejecting' : 'accepting'}Order`, {
          id: orderID,
          xhr: confirmRequest,
        });
      }
    });
  }

  return confirmRequest;
}

export { events };

export function acceptingOrder(orderID) {
  return !!acceptPosts[orderID];
}

export function acceptOrder(orderID) {
  return confirmOrder(orderID);
}

export function rejectingOrder(orderID) {
  return !!rejectPosts[orderID];
}

export function rejectOrder(orderID) {
  return confirmOrder(orderID, true);
}

export function cancelingOrder(orderID) {
  return !!cancelPosts[orderID];
}

export function cancelOrder(orderID) {
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

        const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedCancelHeading'),
          failReason,
        );
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

          const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
          openSimpleMessage(
            app.polyglot.t('orderUtil.failedFulfillHeading'),
            failReason,
          );
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

        const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedRefundHeading'),
          failReason,
        );
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

export function completeOrder(orderID, data = {}) {
  if (!orderID) {
    throw new Error('Please provide an orderID');
  }

  // 校验ratings数据
  const validateRatings = (ratings) => {
    const errors = [];
    
    ratings.forEach((ratingData, index) => {
      const rating = new Rating(ratingData);
      const validationErrors = rating.validate(ratingData);
      
      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, fieldErrors]) => {
          errors.push(`Item ${index + 1} - ${field}: ${fieldErrors.join(', ')}`);
        });
      }
    });
    
    return errors;
  };

  // 检查是否有ratings数据
  if (!data.ratings || !Array.isArray(data.ratings) || data.ratings.length === 0) {
    ElMessage({
      message: '请提供评分数据',
      type: 'error',
      duration: 3000
    });
    return Promise.reject(new Error('Ratings data is required'));
  }

  // 校验ratings数据
  const validationErrors = validateRatings(data.ratings);
  if (validationErrors.length > 0) {
    ElMessage({
      message: validationErrors.join('\n'),
      type: 'error',
      duration: 5000
    });
    return Promise.reject(new Error('Ratings validation failed'));
  }

  if (completePosts[orderID]) {
    return completePosts[orderID].xhr;
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
            initiator: walletAddress,
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
            // 有链上指令，先走链上交易
            events.trigger('executeSolanaTransaction', {
              instructions: response.instructions,
              orderID,
              metadata: data
            });
            
            // 等待链上交易完成
            const transactionResult = await new Promise((resolveTx, rejectTx) => {
              const handleTransactionComplete = (e) => {
                if (e.orderID === orderID) {
                  events.off('solanaTransactionComplete', handleTransactionComplete);
                  events.off('solanaTransactionError', handleTransactionError);
                  resolveTx(e.result);
                }
              };
              
              const handleTransactionError = (e) => {
                if (e.orderID === orderID) {
                  events.off('solanaTransactionComplete', handleTransactionComplete);
                  events.off('solanaTransactionError', handleTransactionError);
                  rejectTx(e.error);
                }
              };
              
              events.on('solanaTransactionComplete', handleTransactionComplete);
              events.on('solanaTransactionError', handleTransactionError);
            });
            
            // 交易完成后，调用order/complete
            const result = await myPost(app.getServerUrl('order/complete'), {
              orderID,
              ...data,
              transactionID: transactionResult
            });
            resolve(result);
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
    })
    .catch(error => {
      jqPromise.reject(error);
      events.trigger('completeOrderFail', {
        id: orderID,
        xhr: jqPromise
      });
      // 显示错误消息
      const failReason = error.message || '';
      openSimpleMessage(
        app.polyglot.t('orderUtil.failedCompleteHeading'),
        failReason,
      );
    })
    .finally(() => {
      delete completePosts[orderID];
      events.trigger('completeOrderComplete', {
        id: orderID,
        xhr: jqPromise
      });
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

          const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
          openSimpleMessage(
            app.polyglot.t('orderUtil.failedOpenDisputeHeading'),
            failReason,
          );
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

          const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
          openSimpleMessage(
            app.polyglot.t('orderUtil.failedResolveHeading'),
            failReason,
          );
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

  let post = acceptPayoutPosts[orderID];

  if (!post) {
    post = myPost(app.getServerUrl('ob/releasefunds'), {
      orderID,
    }).always(() => {
      delete acceptPayoutPosts[orderID];
    }).done(() => {
      events.trigger('acceptPayoutComplete', {
        id: orderID,
        xhr: post,
      });
    })
      .fail((xhr) => {
        events.trigger('acceptPayoutFail', {
          id: orderID,
          xhr: post,
        });

        const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedAcceptPayoutHeading'),
          failReason,
        );
      });

    acceptPayoutPosts[orderID] = post;
    events.trigger('acceptingPayout', {
      id: orderID,
      xhr: post,
    });
  }

  return post;
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
    post = myPost(app.getServerUrl('ob/releaseescrow'), {
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

        const failReason = (xhr.responseJSON && xhr.responseJSON.reason) || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedReleaseEscrowHeading'),
          failReason,
        );
      });

    releaseEscrowPosts[orderID] = post;
    events.trigger('releasingEscrow', {
      id: orderID,
      xhr: post,
    });
  }

  return post;
}
