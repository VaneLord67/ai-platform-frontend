<template>
  <div class="app-container">
    <h1 class="app-title">面向多AI模型部署管理的微服务平台</h1>
    <div class="login-container">
      <el-form
        :model="loginForm"
        ref="loginForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            type="password"
            v-model="loginForm.password"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item class="login-button">
          <el-button type="primary" @click="handleRegister">注册</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: "Register",

  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      rules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
        ],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }],
      },
    };
  },

  methods: {
    handleRegister() {
      
    },
  },
};
</script>

<style scoped>
.app-container {
  max-width: 400px;
  margin: 0 auto;
  margin-top: 150px;
  /* border: 2px solid blue; */
}

.app-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: blue;
}
.login-container {
  max-width: 400px;
  margin: 0 auto;
  margin-top: 50px;
  padding-right: 20px;
}

.login-button {
  padding-right: 30px;
}
</style>