<template>
  <el-container>
    <load-notification></load-notification>
    <el-header>
      <div class="navigation-header">
        <span class="navigation-title"><router-link to="/" tag="span">面向多AI模型部署管理的微服务平台</router-link></span>
        <router-link v-show="showLogReg" to="/login" tag="span" class="navigation-right">登录/注册</router-link>
        <span @click="logout()" v-show="!showLogReg" class="navigation-right">注销</span>
      </div>
    </el-header>
    <el-container style="border-right: 1px solid #eee">
      <el-aside width="200px">
        <el-menu :default-openeds="['1', '2', '3']" :router="true">
          <el-submenu index="1">
            <template slot="title"
              ><i class="el-icon-user"></i>用户</template
            >
            <el-menu-item-group>
              <el-menu-item index="/auth/manage">管理</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="2">
            <template slot="title"><i class="el-icon-cloudy"></i>AI</template>
            <el-menu-item-group>
              <el-menu-item index="/detection">检测</el-menu-item>
              <el-menu-item index="/recognition">分类</el-menu-item>
              <el-menu-item index="/track">跟踪</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="3">
            <template slot="title"
              ><i class="el-icon-monitor"></i>监控</template
            >
            <el-menu-item-group>
              <el-menu-item index="/monitor/requestLog">请求日志</el-menu-item>
              <el-menu-item index="/monitor/statistics">流量查看</el-menu-item>
              <el-menu-item index="/monitor/load">硬件负载</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main><slot></slot></el-main>
    </el-container>
  </el-container>
</template>
  
<script>
import { getToken, removeToken } from "@/utils/storage.js";
import LoadNotification from "../monitor/LoadNotification.vue";
export default {
  name: "Navigation",
  components: {
    LoadNotification,
  },
  data() {
    return {
      showLogReg: true,
    };
  },

  methods: {
    logout() {
      removeToken()
      this.$router.push({ path: "/login" });
    },
  },

  mounted() {
    let token = getToken()
    if (token == "" || token == null || token == undefined) {
      this.showLogReg = true;
    } else {
      this.showLogReg = false;
    }
  }
};
</script>
  
<style scoped>
.navigation-header {
  margin-top: 10px;
}

.navigation-title {
  font-weight: bold;
  color: blue;
  font-size: large;
  text-align: center;
  margin-left: 40%;
  cursor: pointer;
}

.navigation-right {
  font-weight: bold;
  font-size: large;
  text-align: right;
  float: right;
  cursor: pointer;
}

.el-aside {
  color: #333;
}
</style>