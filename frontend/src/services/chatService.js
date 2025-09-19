import { myGet, myPost, myAjax } from '../api/api';
import app from '../../backbone/app';

class ChatService {
  // 获取聊天会话列表
  async getConversations() {
    try {
      const response = await myGet(app.getServerUrl('ob/chatconversations'));
      
      // 获取所有会话的用户资料
      if (response && response.length > 0) {
        const peerIDs = response.map(conv => conv.peerID);
        
        // 直接获取用户资料，避免使用getCachedProfiles
        const profilePromises = peerIDs.map(async (peerID) => {
          try {
            const profileResponse = await myGet(app.getServerUrl(`ob/profile/${peerID}`));
            return profileResponse;
          } catch (error) {
            console.warn(`Failed to fetch profile for ${peerID}:`, error);
            return null;
          }
        });
        
        // 等待所有资料获取完成
        const profiles = await Promise.all(profilePromises);
        
        // 将资料信息合并到会话数据中
        response.forEach((conversation, index) => {
          if (profiles[index]) {
            conversation.profile = profiles[index];
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  }

  // 获取指定会话的消息
  async getMessages(peerID) {
    try {
      const response = await myGet(app.getServerUrl(`ob/chatmessages/${peerID}`));
      return response;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  // 获取群组消息
  async getGroupMessages(orderID, params = {}) {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      // 使用路径参数格式: ob/groupchatmessages/{orderID}
      const url = queryParams.toString() 
        ? app.getServerUrl(`ob/groupchatmessages/${orderID}?${queryParams}`)
        : app.getServerUrl(`ob/groupchatmessages/${orderID}`);
        
      const response = await myGet(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch group messages:', error);
      throw error;
    }
  }

  // 发送消息
  async sendMessage(peerID, message, orderID = '', file = null) {
    try {
      const messageData = {
        peerID,
        message,
        orderID
      };
      
      // 如果有文件，添加到消息数据中
      if (file) {
        messageData.file = file;
      }
      
      const response = await myPost(app.getServerUrl('ob/chatmessage'), messageData);
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // 发送群组消息
  async sendGroupMessage(peerIDs, message, orderID = '', file = null) {
    try {
      const messageData = {
        peerIDs,
        message,
        orderID,
        timestamp: Date.now()
      };
      
      // 如果有文件，添加到消息数据中
      if (file) {
        messageData.file = file;
      }
      
      const response = await myPost(app.getServerUrl('ob/groupchatmessage'), messageData);
      return response;
    } catch (error) {
      console.error('Failed to send group message:', error);
      throw error;
    }
  }

  // 标记会话为已读
  async markAsRead(peerID, orderID) {
    try {
      return await myPost(app.getServerUrl('ob/markchatasread'), {
        peerID,
        orderID,
      })
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      // 不抛出错误，因为这不是关键功能
      return null;
    }
  }

  // 标记群组会话为已读
  async markGroupAsRead(orderID) {
    try {
      return await myPost(app.getServerUrl('ob/markchatasread'), {
        orderID,
      })
    } catch (error) {
      console.error('Failed to mark group conversation as read:', error);
      // 不抛出错误，因为这不是关键功能
      return null;
    }
  }

  // 发送正在输入状态
  async sendTyping(peerID) {
    try {
      const response = await myPost(app.getServerUrl('ob/typingmessage'), {
        peerID,
        message: ''
      });
      return response;
    } catch (error) {
      console.error('Failed to send typing status:', error);
      throw error;
    }
  }

  // 发送群组正在输入状态
  async sendGroupTyping(peerIDs, orderID = '') {
    try {
      const response = await myPost(app.getServerUrl('ob/grouptypingmessage'), {
        peerIDs,
        orderID,
      });
      return response;
    } catch (error) {
      console.error('Failed to send group typing status:', error);
      throw error;
    }
  }

  // 上传图片
  async uploadImage(file) {
    try {
      const response = await myAjax({
        url: app.getServerUrl('ob/images'),
        type: 'POST',
        data: JSON.stringify([file]),
        dataType: 'json',
        contentType: 'application/json',
      });
      return response;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // 添加客服
  async addCustomerService(data) {
    try {
      const response = await myPost(app.getServerUrl('ob/addcustomerservice'), data);
      return response;
    } catch (error) {
      console.error('Failed to add customer service:', error);
      throw error;
    }
  }

  // 删除消息
  async deleteMessage(messageID) {
    try {
      const response = await myPost(app.getServerUrl(`ob/chatmessage/${messageID}/delete`));
      return response;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // 获取消息统计
  async getMessageStats() {
    try {
      const response = await myGet(app.getServerUrl('ob/chatstats'));
      return response;
    } catch (error) {
      console.error('Failed to fetch message stats:', error);
      throw error;
    }
  }

  // 搜索消息
  async searchMessages(query, peerID = null) {
    try {
      const params = new URLSearchParams({ q: query });
      if (peerID) {
        params.append('peerID', peerID);
      }
      
      const response = await myGet(app.getServerUrl(`ob/chatmessages/search?${params}`));
      return response;
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  }

  // 获取聊天设置
  async getChatSettings() {
    try {
      const response = await myGet(app.getServerUrl('ob/chatsettings'));
      return response;
    } catch (error) {
      console.error('Failed to fetch chat settings:', error);
      throw error;
    }
  }

  // 更新聊天设置
  async updateChatSettings(settings) {
    try {
      const response = await myPost(app.getServerUrl('ob/chatsettings'), settings);
      return response;
    } catch (error) {
      console.error('Failed to update chat settings:', error);
      throw error;
    }
  }
}

export default new ChatService();