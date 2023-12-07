<template>
  <navigation>
    <h1 style="text-align: center;">测试模拟</h1>
    <div class="flex-container">
      <el-form ref="form" :model="form" class="input-form">
        <el-form-item label="图片url">
          <el-input v-model="form.url"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="modelCall">调用</el-button>
        </el-form-item>
      </el-form>
  
      <el-image :src="output_url" class="output-img">
        <div slot="error" class="image-slot">
          检测结果
        </div>
      </el-image>
    </div>

    <!-- <el-upload
      class="upload-demo"
      action="https://jsonplaceholder.typicode.com/posts/"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :file-list="fileList"
      list-type="picture"
    >
      <el-button size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">
        只能上传jpg/png文件，且不超过500kb
      </div>
    </el-upload> -->
  </navigation>
</template>

<script>
import Navigation from "../common/Navigation.vue";
export default {
  name: "Detection",
  components: {
    Navigation,
  },
  data() {
    return {
      form: {
        url: "",
      },
      output_url: "",
    };
  },
  methods: {
    modelCall() {
      let dto = {
        hyperparameter: {},
        supportInput: {
          type: "single_picture_url",
          value: this.form.url,
        },
      }
      this.$axios.post("/model/detection/call", dto).then((res) => {
        if (res && res.code != 1) {
          this.$message({
            type: "warning",
            message: "调用失败!",
          });
          return;
        }
        this.output_url = res.data.url
      });
    },
  },
};
</script>

<style>
.flex-container {
  display: flex;
}
.input-form {
  width: 48%;
  margin-right: 50px;
}
.output-img {
  height: 400px;
  width: 400px;
  border: 1px solid;
}
.image-slot {
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  height: 100%; /* 使容器高度占满 el-image，确保垂直居中生效 */
}
</style>