import axios from "axios";
import { getToken } from "@/utils/storage.js";
import router from '@/router/index.js';
import Vue from 'vue';

export const baseURL = "http://localhost:8086";

export const Axios = axios.create({
  baseURL: baseURL,
  timeout: 5000,
});

/**
 * 请求拦截
 */

Axios.interceptors.request.use(
  (config) => {
    config.headers["Authorization"] = getToken();
    return config;
  },
  (err) => {
    Promise.reject(err);
  }
);
/**
 * 响应拦截
 */
Axios.interceptors.response.use(
  (res) => {
    // console.log(res)
    // console.log(res.data.Code)
    switch (res.data.Code) {
      case 104:
      case 105:
        Vue.prototype.$message({
          type: "warning",
          message: "请登录",
        });
        router.replace({
          path: '/login',
        })
        break
      case 429:
        Vue.prototype.$message({
          type: "error",
          message: "服务器正忙,请稍后再次访问",
        });
        break
      default:
        break
    }
    return res.data
  },
  (err) => {
    // console.log(err.response)
    return Promise.reject(err);
  }
);

