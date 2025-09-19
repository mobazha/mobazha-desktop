import Sdk from "casdoor-js-sdk";

let sdkConfig;
if (import.meta.env.VITE_PROD_TEST) {
  // 生产测试环境配置
  sdkConfig = {
    serverUrl: "https://test-login.mobazha.org",
    clientId: "22649a5edc7cabcb4398",
    organizationName: "built-in",
    appName: "app-built-in",
    redirectPath: "/callback",
  };
} else if (import.meta.env.DEV) {
  sdkConfig = {
    serverUrl: "http://localhost:7001",
    clientId: "22649a5edc7cabcb4398",
    organizationName: "built-in",
    appName: "app-built-in",
    redirectPath: "/callback",
  };
} else {
  // 正式生产环境配置
  sdkConfig = {
    serverUrl: "https://login.mobazha.org",
    clientId: "44b16199e0b7b1d64b25",
    organizationName: "mobazha",
    appName: "app_mobazha",
    redirectPath: "/callback",
  };
}
  
export const CasdoorSdk = new Sdk(sdkConfig);

let hosting_server;
if (import.meta.env.DEV) {
  hosting_server = 'http://localhost:8088';
} else if (import.meta.env.VITE_PROD_TEST) {
  hosting_server = 'https://test-store.mobazha.org';  // 生产测试环境
} else {
  hosting_server = 'https://store.mobazha.org';       // 正式生产环境
}

export { hosting_server };

export const isLoggedIn = () => {
  const token = localStorage.getItem("token");
  return token !== null && token.length > 0;
};

export const getSigninUrl = () => {
  return CasdoorSdk.getSigninUrl();
};

export function getSignupUrl() {
  return CasdoorSdk.getSignupUrl();
}

export function signin() {
  return CasdoorSdk.signin(hosting_server);
}

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const goToLink = (link) => {
  window.location.href = link;
};

export const getUserinfo = () => {
  return fetch(`${hosting_server}/api/userinfo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }).then((res) => res.json());
};

export const getUsers = () => {
  return fetch(`${sdkConfig.serverUrl}/api/get-users?owner=${sdkConfig.organizationName}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }).then((res) => res.json());
};

export const doTelegramLogin = () => {
  return fetch(`${hosting_server}/api/telegramSignin${window.location.search}`, {
    method: "POST"
  }).then((res) => res.json());
};
