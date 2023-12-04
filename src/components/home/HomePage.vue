<template>
  <navigation>
    <h1>
      平台简介：<br><br>
    </h1>
    基于TensorRT深度学习推理架构和Nameko基础微服务库，设计并实现一个面向多AI模型部署管理的微服务平台。
    针对检测、识别、跟踪等典型AI模型部署，封装多输入形式（图像序列和IP地址）的接口服务，
    提供服务启停、服务发现、负载均衡、服务多实例等微服务基础功能，并实现Web管理平台页面，
    包括微服务算法参数配置与测试模拟、任务请求/设备状况/流量可视化监控、一键启停控制、任务阻塞预警、硬件资源红线预警、报错前台提示等功能。
    
  </navigation>
</template>

<script>
import Navigation from "../common/Navigation.vue";
export default {
  name: "HomePage",
  components: {
    Navigation,
  },

  data() {
    return {};
  },

  methods: {
    
  },

};
</script>

<style>
</style>