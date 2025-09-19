const state = {
  isConnected: false,
  address: '',
  connection: null,
  walletProvider: null
};

const mutations = {
  SET_WALLET_STATE(state, { isConnected, address, connection, walletProvider }) {
    state.isConnected = isConnected;
    state.address = address;
    state.connection = connection;
    state.walletProvider = walletProvider;
  }
};

const actions = {
  updateWalletState({ commit }, payload) {
    commit('SET_WALLET_STATE', payload);
  },
  
  async checkWalletConnection({ state }) {
    return state.isConnected;
  }
};

const getters = {
  isWalletConnected: state => state.isConnected,
  walletAddress: state => state.address,
  walletConnection: state => state.connection,
  walletProvider: state => state.walletProvider
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 