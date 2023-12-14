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

    <div class="flex-container">
      <el-form ref="form" :model="form" class="input-form">
        <!-- <el-form-item label="图片url">
          <el-input v-model="form.url"></el-input>
        </el-form-item> -->

        url
        <el-form-item
          v-for="(url, index) in form.urls"
          :label="url.name"
          :key="url.key"
          :prop="'urls.' + index + '.value'"
        >
          <el-input v-model="url.value"></el-input>
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
          <el-button v-show="form.supportInput === '多张图片输入'" @click="addUrl">新增图片url</el-button>
        </el-form-item>
      </el-form>

      
    </div>
    
    <div v-show="this.output_urls.length > 0 && form.supportInput != '视频输入'">
      <el-image v-for="(output_url, index) in this.output_urls" :key="index" :src="output_url" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>
    <div v-show="this.output_urls.length == 0 && form.supportInput != '视频输入'">
      <el-image :src="''" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>

    <!-- <video v-show="form.supportInput === '视频输入'" controls width="100%" height="auto">
      <source v-for="(output_url, index) in this.output_urls" :key="index" :src="output_url" type="video/mp4">
    </video> -->

    <video v-show="form.supportInput === '视频输入'" :src="video_src" controls width="auto" height="auto">
    </video>

    <div v-for="(frame, index) in this.frames" :key="index" >
      <div style="font-weight: bold; padding-bottom: 50px; padding-top: 50px;">
        {{ 'frame' + index + ':' }}
      </div>
      <el-descriptions :title="'box' + boxIndex + ':'" v-for="(box, boxIndex) in frame" :key="boxIndex">
        <el-descriptions-item label="left">{{ box.left }}</el-descriptions-item>
        <el-descriptions-item label="right">{{ box.right }}</el-descriptions-item>
        <el-descriptions-item label="bottom">{{ box.bottom }}</el-descriptions-item>
        <el-descriptions-item label="top">{{ box.top }}</el-descriptions-item>
        <el-descriptions-item label="confidence">{{ box.confidence }}</el-descriptions-item>
        <el-descriptions-item label="class_name">{{ box.class_name }}</el-descriptions-item>
      </el-descriptions>
    </div>

    
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
        urls: [],
        supportInput: "单张图片输入",
        hyperparameters: [],
      },
      output_urls: [],
      video_src: "",
      frames: [],
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
      this.output_urls = [];
      this.frames = [];
      let supportInput = {}
      // console.log(this.form.urls)
      if (this.form.supportInput == '单张图片输入') {
        supportInput.type = "single_picture_url";
        supportInput.value = this.form.urls[0].value.trim();
      } else if (this.form.supportInput == "多张图片输入") {
        supportInput.type = "multiple_picture_url";
        supportInput.value = this.form.urls.map(v => v.value.trim());
      } else if (this.form.supportInput == "视频输入") {
        supportInput.type = "video_url";
        supportInput.value = this.form.urls[0].value.trim();
      }
      let dto = {
        hyperparameters: this.form.hyperparameters,
        supportInput: supportInput,
      };
      this.$axios.post("/model/detection/call", dto).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: "warning",
            message: "调用失败!",
          });
          return;
        }
        this.output_urls = res.data.urls;
        if (this.form.supportInput === "视频输入") {
          this.video_src = this.output_urls[0];
        }
        this.frames = res.data.frames;
        // console.log(this.output_urls);
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
    addUrl() {
      this.form.urls.push({
        value: '',
        key: Date.now(),
      });
    },
  },
  mounted() {
    this.$nextTick(() => {
      // 等到整个视图都渲染完毕再执行操作
      this.addUrl();
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