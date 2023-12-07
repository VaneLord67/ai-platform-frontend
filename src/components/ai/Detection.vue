<template>
  <navigation>
    <div style="font-weight: bold; padding-bottom: 20px;">
      服务信息
    </div>
    <el-descriptions v-show="showServiceInfo">
      <el-descriptions-item label="适用领域">{{ modelField }}</el-descriptions-item>
      <el-descriptions-item label="模型名">{{ modelName }}</el-descriptions-item>
    </el-descriptions>

    <el-descriptions>
      <el-descriptions-item label="正在运行的实例数">{{ runningInstanceCount }}</el-descriptions-item>
      <el-descriptions-item label="可运行的实例数">{{ readyInstanceCount }}</el-descriptions-item>
    </el-descriptions>

    <!-- <div class="service-statistic">
      <el-row :gutter="20">
        <el-col :span="30">
          <div>
            <el-statistic
              :value="runningInstanceCount"
              title="正在运行的实例数"
            >
            </el-statistic>
          </div>
        </el-col>
        <el-col :span="30">
          <div>
            <el-statistic :value="readyInstanceCount" title="可运行的实例数">
            </el-statistic>
          </div>
        </el-col>
      </el-row>
    </div> -->

    <el-button type="success" round size="small" @click="start()">启动一个实例</el-button>
    <el-button type="danger" round size="small" @click="stop()">停止一个实例</el-button>
    <el-button type="danger" round size="small" @click="stopAll()">一键停止所有实例</el-button>

    <div style="font-weight: bold; padding-top: 20px; padding-bottom: 20px;">
      上传
    </div>
    <UploadFile></UploadFile>

    <div style="font-weight: bold; padding-top: 20px; padding-bottom: 20px; margin-top: 40px">
      测试模拟
    </div>
    <!-- <h1 style="text-align: center">测试模拟</h1> -->
    <div class="flex-container">
      <el-form ref="form" :model="form" class="input-form">
        <el-form-item label="图片url">
          <el-input v-model="form.url"></el-input>
        </el-form-item>

        <el-form-item
          v-for="(hyperparameter, index) in form.hyperparameters"
          :label="hyperparameter.name"
          :key="hyperparameter.key"
          :prop="'hyperparameters.' + index + '.value'"
        >
          <el-input v-model="hyperparameter.value"></el-input>
        </el-form-item>

        <el-form-item label="输入形式">
          <el-radio-group v-model="form.supportInput">
            <el-radio
              v-bind:disabled="!singlePictureSupport"
              label="单张图片输入"
            ></el-radio>
            <el-radio
              v-bind:disabled="!multiplePictureSupport"
              label="多张图片输入"
            ></el-radio>
            <el-radio
              v-bind:disabled="!videoSupport"
              label="视频输入"
            ></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="modelCall" :loading="callLoading" :disabled="callDisabled">{{ callButtonText }}</el-button>
        </el-form-item>
      </el-form>

      <el-image :src="output_url" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
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
import UploadFile from "../common/UploadFile.vue";
export default {
  name: "Detection",
  components: {
    Navigation, UploadFile
  },
  data() {
    return {
      callDisabled: true,
      callLoading: false,
      modelName: "",
      modelField: "",
      form: {
        url: "",
        supportInput: "单张图片输入",
        hyperparameters: [],
      },
      output_url: "",
      services: [],
    };
  },
  computed: {
    showServiceInfo: function() {
      if (this.services.length == 0) {
        return false;
      }
      return true;
    },
    callButtonText: function() {
      if (this.callDisabled) {
        return "无正在运行实例，不可调用";
      }
      return "调用";
    },
    runningInstanceCount: function () {
      let count = 0;
      for (const service of this.services) {
        if (service.state == "running") {
          count++;
        }
      }
      return count;
    },
    readyInstanceCount: function () {
      let count = 0;
      for (const service of this.services) {
        if (service.state == "ready") {
          count++;
        }
      }
      return count;
    },
    singlePictureSupport: function () {
      if (this.services.length == 0) {
        return false;
      }
      if (this.services[0].model.support_input.includes("single_picture_url")) {
        return true;
      }
      return false;
    },
    multiplePictureSupport: function () {
      if (this.services.length == 0) {
        return false;
      }
      if (
        this.services[0].model.support_input.includes("multiple_picture_url")
      ) {
        return true;
      }
      return false;
    },
    videoSupport: function () {
      if (this.services.length == 0) {
        return false;
      }
      if (this.services[0].model.support_input.includes("video_url")) {
        return true;
      }
      return false;
    },
  },
  methods: {
    modelCall() {
      this.callLoading = true;
      let dto = {
        hyperparameters: this.form.hyperparameters,
        supportInput: {
          type: "single_picture_url",
          value: this.form.url,
        },
      };
      this.$axios.post("/model/detection/call", dto).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: "warning",
            message: "调用失败!",
          });
          return;
        }
        this.output_url = res.data.url;
      }).finally(() => {
        this.callLoading = false;
      });
    },
    getDetectionServiceList() {
      this.$axios.get("/model/manage/service/detection/list").then((res) => {
        this.services = res.data;
        if (this.services.length == 0) {
          this.callDisabled = true;
        }
        if (this.services.length > 0) {
          this.form.hyperparameters = this.services[0].model.hyperparameters;
          this.modelName = this.services[0].model.name;
          this.modelField = this.services[0].model.field;
          this.callDisabled = false;
        }
      });
    },
    stopAll() {
      this.$axios.post("/model/manage/service/detection/stop_all").then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getDetectionServiceList();
        }, 5000);
      });
    },
    stop() {
      this.$axios.post("/model/manage/service/detection/stop").then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getDetectionServiceList();
        }, 5000);
      });
    },
    start() {
      this.$axios.post("/model/manage/service/detection/start").then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getDetectionServiceList();
        }, 5000);
      })
    },
  },
  mounted() {
    this.$nextTick(() => {
      // 等到整个视图都渲染完毕再执行操作
      this.getDetectionServiceList();
    });
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
.service-statistic {
  display: flex;
  justify-content: center; /* 水平居中 */
}
</style>