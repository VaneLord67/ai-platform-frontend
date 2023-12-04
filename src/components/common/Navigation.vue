<template>
  <el-container>
    <el-header >
      <div class="navigation-header">
        <span class="navigation-title">面向多AI模型部署管理的微服务平台</span>
        <span class="navigation-right">注销</span>
      </div>
    </el-header>
    <el-container style="border-right: 1px solid #eee">
      <el-aside width="200px">
        <el-menu :default-openeds="['1', '2']">
          <el-submenu index="1">
            <template slot="title"
              ><i class="el-icon-user-solid"></i>用户</template
            >
            <el-menu-item-group>
              <el-menu-item index="1-1">权限分配</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="2">
            <template slot="title"><i class="el-icon-cloudy"></i>AI</template>
            <el-menu-item-group>
              <el-menu-item index="2-1">检测</el-menu-item>
              <el-menu-item index="2-2">识别</el-menu-item>
              <el-menu-item index="2-3">跟踪</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main>主界面布局</el-main>
    </el-container>
  </el-container>
</template>
  
  <script>
export default {
  name: "Navigation",

  data() {
    return {};
  },

  methods: {},
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