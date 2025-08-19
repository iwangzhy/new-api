import {formatMessageForAPI, getUserIdFromLocalStorage, isValidMessage, showError} from './utils';
import axios from 'axios';
import {MESSAGE_ROLES} from '../constants/playground.constants';

// 创建 axios 实例
export let API = axios.create({
  // baseURL
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL
    ? import.meta.env.VITE_REACT_APP_SERVER_URL
    : '',
  // 请求头
  headers: {
    'New-API-User': getUserIdFromLocalStorage(),
    'Cache-Control': 'no-store',
  },
});

function patchAPIInstance(instance) {
  // 将 instance get 方法中的  this 永久绑定为为 instance 对象
  // 目的是：确保无论以何种方式调用该方法，它内部的 this 始终指向 axios 实例。
  // 这是一种防御性编程手段
  const originalGet = instance.get.bind(instance); // axios instance 原始的 get 方法
  const inFlightGetRequests = new Map();

  // 根据请求的 url 和 config 生成一个 key
  const genKey = (url, config = {}) => {
    const params = config.params ? JSON.stringify(config.params) : '{}';
    return `${url}?${params}`;
  };

  // 对 instance 的 get 方法进行增强
  instance.get = (url, config = {}) => {
    if (config?.disableDuplicate) { // 如果请求 config.disableDuplicate ，直接调用原始 get 方法
      return originalGet(url, config);
    }

    // 同一时间，会存在多个 get 请求，url、config 等都相同
    // 在 get 请求结束前，缓存 key ，reqPromise
    // 在 get 请求结束时，从缓存中删除这个记录
    // 在 get 请求未结束时，有相同的请求过来，直接从缓存中获取 promise 并返回
    const key = genKey(url, config);
    if (inFlightGetRequests.has(key)) {
      return inFlightGetRequests.get(key);
    }

    // 请求结束时，从缓存中，根据 key 删除
    const reqPromise = originalGet(url, config).finally(() => {
      inFlightGetRequests.delete(key);
    });
    // 缓存
    inFlightGetRequests.set(key, reqPromise);
    return reqPromise;
  };
}

patchAPIInstance(API);

export function updateAPI() {
  API = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL
      ? import.meta.env.VITE_REACT_APP_SERVER_URL
      : '',
    headers: {
      'New-API-User': getUserIdFromLocalStorage(),
      'Cache-Control': 'no-store',
    },
  });

  patchAPIInstance(API);
}

// 响应拦截器，本拦截器用于处理错误
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果请求配置中显式要求跳过全局错误处理，则不弹出默认错误提示
    if (error.config && error.config.skipErrorHandler) {
      return Promise.reject(error);
    }
    // 显示错误弹框
    showError(error);
    return Promise.reject(error);
  },
);

// playground

// 构建API请求负载（请求 body）
export const buildApiPayload = (messages, systemPrompt, inputs, parameterEnabled) => {
  const processedMessages = messages
    // 过滤出有效的 message
    .filter(isValidMessage)
    // 转换为 [{ role , content }, ... ] 格式
    .map(formatMessageForAPI)
    // 过滤掉假值， map 方法可能会出现一些 null 对象，在这一步过滤掉
    // .filter(item=>{
    //   return Boolean(item)
    // })
    .filter(Boolean);

  // 如果有系统提示，插入到消息开头
  if (systemPrompt && systemPrompt.trim()) {
    // unshift 在数组开头插入一个元素
    processedMessages.unshift({
      role: MESSAGE_ROLES.SYSTEM,
      content: systemPrompt.trim()
    });
  }

  const payload = {
    model: inputs.model,
    messages: processedMessages,
    group: inputs.group,
    stream: inputs.stream,
  };

  // 添加启用的参数
  const parameterMappings = {
    temperature: 'temperature',
    top_p: 'top_p',
    max_tokens: 'max_tokens',
    frequency_penalty: 'frequency_penalty',
    presence_penalty: 'presence_penalty',
    seed: 'seed'
  };

  // parameterMappings 里面的字段，添加到 payload 中。
  Object.entries(parameterMappings).forEach(([key, param]) => {
    if (parameterEnabled[key] && inputs[param] !== undefined && inputs[param] !== null) {
      payload[param] = inputs[param];
    }
  });

  return payload;
};

// 处理API错误响应
export const handleApiError = (error, response = null) => {
  const errorInfo = {
    error: error.message || '未知错误',
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  if (response) {
    errorInfo.status = response.status;
    errorInfo.statusText = response.statusText;
  }

  if (error.message.includes('HTTP error')) {
    errorInfo.details = '服务器返回了错误状态码';
  } else if (error.message.includes('Failed to fetch')) {
    errorInfo.details = '网络连接失败或服务器无响应';
  }

  return errorInfo;
};

// 处理模型数据
export const processModelsData = (data, currentModel) => {
  // [{label,value}]
  const modelOptions = data.map(model => ({
    label: model,
    value: model,
  }));

  // data 中是否包含 currentModel
  const hasCurrentModel = modelOptions.some(option => option.value === currentModel);
  const selectedModel = hasCurrentModel && modelOptions.length > 0
    ? currentModel
    : modelOptions[0]?.value;

  return {modelOptions, selectedModel};
};

// 处理分组数据
export const processGroupsData = (data, userGroup) => {
  let groupOptions = Object.entries(data).map(([group, info]) => ({
    label: info.desc.length > 20 ? info.desc.substring(0, 20) + '...' : info.desc,
    value: group,
    ratio: info.ratio,
    fullLabel: info.desc,
  }));

  if (groupOptions.length === 0) {
    groupOptions = [{
      label: '用户分组',
      value: '',
      ratio: 1,
    }];
  } else if (userGroup) {
    const userGroupIndex = groupOptions.findIndex(g => g.value === userGroup);
    if (userGroupIndex > -1) {
      const userGroupOption = groupOptions.splice(userGroupIndex, 1)[0];
      groupOptions.unshift(userGroupOption);
    }
  }

  return groupOptions;
};

// 原来components中的utils.js

export async function getOAuthState() {
  let path = '/api/oauth/state';
  let affCode = localStorage.getItem('aff');
  if (affCode && affCode.length > 0) {
    path += `?aff=${affCode}`;
  }
  const res = await API.get(path);
  const {success, message, data} = res.data;
  if (success) {
    return data;
  } else {
    showError(message);
    return '';
  }
}

export async function onOIDCClicked(auth_url, client_id, openInNewTab = false) {
  const state = await getOAuthState();
  if (!state) return;
  const redirect_uri = `${window.location.origin}/oauth/oidc`;
  const response_type = 'code';
  const scope = 'openid profile email';
  const url = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}`;
  if (openInNewTab) {
    window.open(url);
  } else {
    window.location.href = url;
  }
}

export async function onGitHubOAuthClicked(github_client_id) {
  const state = await getOAuthState();
  if (!state) return;
  window.open(
    `https://github.com/login/oauth/authorize?client_id=${github_client_id}&state=${state}&scope=user:email`,
  );
}

export async function onLinuxDOOAuthClicked(linuxdo_client_id) {
  const state = await getOAuthState();
  if (!state) return;
  window.open(
    `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${linuxdo_client_id}&state=${state}`,
  );
}

let channelModels = undefined;

export async function loadChannelModels() {
  const res = await API.get('/api/models');
  const {success, data} = res.data;
  if (!success) {
    return;
  }
  channelModels = data;
  localStorage.setItem('channel_models', JSON.stringify(data));
}

export function getChannelModels(type) {
  if (channelModels !== undefined && type in channelModels) {
    if (!channelModels[type]) {
      return [];
    }
    return channelModels[type];
  }
  let models = localStorage.getItem('channel_models');
  if (!models) {
    return [];
  }
  channelModels = JSON.parse(models);
  if (type in channelModels) {
    return channelModels[type];
  }
  return [];
}
