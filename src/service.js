import axios from "axios";
import { getToken } from "@/utils/storage.js";
import router from '@/router/index.js';
import Vue from 'vue';

// export const baseURL = "http://192.168.1.208:8086";
// export const webrtcURL = "http://192.168.1.208:8000";
// export const srsWebrtcURL = "webrtc://192.168.1.208/live";
export const srsWebrtcURL = "webrtc://localhost/live";
export const baseURL = "http://localhost:8086";
export const webrtcURL = "http://localhost:8000";

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
    switch (res.data.code) {
      case 403:
        Vue.prototype.$message({
          type: "warning",
          message: "请登录",
        });
        router.replace({
          path: '/login',
        })
        break;
      default:
        break;
    }
    return res.data;
  },
  (err) => {
    // console.log(err.response)
    return Promise.reject(err);
  }
);

