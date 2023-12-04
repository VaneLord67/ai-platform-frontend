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
          <el-button type="primary" @click="handleLogin">登录</el-button>
          <el-button type="primary" @click="handleRegister">注册</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { setToken } from "@/utils/storage.js";
export default {
  name: "Login",

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
    handleLogin() {
      let username = this.loginForm.username
      let password = this.loginForm.password
      if (username == "" || password == "") {
        return alert("输入为空")
      }
      let loginDto = {
        username: username,
        password: password,
      };
      this.$axios.post("/user/login", loginDto).then((res) => {
        if (res && res.code != 1) {
          this.$message({
            type: "warning",
            message: "用户名或密码错误!",
          });
          return;
        }
        let jwt = res.data;
        if (!jwt) {
          this.$message({
            type: "error",
            message: "用户名或密码错误!",
          });
          return;
        }
        setToken(res.data);
        this.$message({
          type: "success",
          message: "登录成功!",
        });
        this.$router.push({ path: "/" });
      });
    },
    handleRegister() {
      let username = this.loginForm.username
      let password = this.loginForm.password
      if (username == "" || password == "") {
        return alert("输入为空")
      }
      let registerDto = {
        username: username,
        password: password,
      };
      this.$axios.post("/user/register", registerDto).then((res) => {
        if (res && res.code != 1) {
          this.$message({
            type: "warning",
            message: "注册失败!",
          });
          return;
        }
        let jwt = res.data;
        if (!jwt) {
          this.$message({
            type: "error",
            message: "注册失败!",
          });
          return;
        }
        setToken(res.data);
        this.$message({
          type: "success",
          message: "注册成功!",
        });
        this.$router.push({ path: "/" });
      });
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