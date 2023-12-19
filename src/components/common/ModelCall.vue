<template>
  <div>
    <div style="font-weight: bold; padding-top: 20px; padding-bottom: 20px; margin-top: 40px">
      测试模拟
    </div>

    <div class="flex-container">
      <el-form ref="form" :model="form" class="input-form">

        <div v-show="form.supportInput != '摄像头输入'">
          url
          <el-form-item v-for="(url, index) in form.urls" :label="url.name" :key="url.key"
            :prop="'urls.' + index + '.value'">
            <el-input v-model="url.value"></el-input>
          </el-form-item>
        </div>

        <el-form-item v-show="form.supportInput === '摄像头输入'" label="摄像头id">
          <el-input v-model="form.cameraId"></el-input>
        </el-form-item>

        <el-form-item v-for="(hyperparameter, index) in form.hyperparameters" :label="hyperparameter.name"
          :key="hyperparameter.key" :prop="'hyperparameters.' + index + '.value'">
          <el-input v-model="hyperparameter.value"></el-input>
        </el-form-item>

        <el-form-item label="输入形式">
          <el-radio-group v-model="form.supportInput">
            <el-radio v-bind:disabled="!singlePictureSupport" label="单张图片输入"></el-radio>
            <el-radio v-bind:disabled="!multiplePictureSupport" label="多张图片输入"></el-radio>
            <el-radio v-bind:disabled="!videoSupport" label="视频输入"></el-radio>
            <el-radio v-bind:disabled="!cameraSupport" label="摄像头输入"></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="initSupportInput" :loading="callLoading" :disabled="callDisabled">{{ callButtonText
          }}</el-button>
          <el-button v-show="form.supportInput === '多张图片输入'" @click="addUrl">新增图片url</el-button>
          <el-button v-show="form.supportInput === '摄像头输入'" @click="closeCamera">关闭摄像头</el-button>
        </el-form-item>
      </el-form>
    </div>


  </div>
</template>

<script>
export default {
  name: 'ModelCall',
  props: {
    services: {
      type: Array,
      default: function () {
        return [];
      }
    },
    callDisabled: {
      type: Boolean,
      default: true,
    },
    callLoading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        url: "",
        urls: [],
        supportInput: "单张图片输入",
        hyperparameters: [],
        cameraId: 0,
      },
    }
  },
  watch: {
    form(newValue) {
      this.$emit("form-event", newValue);
    }
  },
  computed: {
    callButtonText: function() {
      if (this.callDisabled) {
        return "无正在运行实例，不可调用";
      }
      return "调用";
    },
    singlePictureSupport: function () {
      return this.supportComputed("single_picture_url");
    },
    multiplePictureSupport: function () {
      return this.supportComputed("multiple_picture_url");
    },
    videoSupport: function () {
      return this.supportComputed("video_url");
    },
    cameraSupport: function() {
      return this.supportComputed("camera");
    }
  },
  methods: {
    addUrl() {
      this.form.urls.push({
        value: '',
        key: Date.now(),
      });
    },
    supportComputed(input_form) {
      if (this.services.length == 0) {
        return false;
      }
      if (this.services[0].model.support_input.includes(input_form)) {
        return true;
      }
      return false;
    },
    initSupportInput() {
      let supportInput = {};
      if (this.form.supportInput == '单张图片输入') {
        supportInput.type = "single_picture_url";
        supportInput.value = this.form.urls[0].value.trim();
      } else if (this.form.supportInput == "多张图片输入") {
        supportInput.type = "multiple_picture_url";
        supportInput.value = this.form.urls.map(v => v.value.trim());
      } else if (this.form.supportInput == "视频输入") {
        supportInput.type = "video_url";
        supportInput.value = this.form.urls[0].value.trim();
      } else if (this.form.supportInput == "摄像头输入") {
        supportInput.type = "camera";
        supportInput.value = this.form.cameraId;
      }
      this.$emit('hyperparameters-event', this.form.hyperparameters);
      this.$emit('support-input-event', supportInput);
    },
    closeCamera() {
      if (this.socket) {
        console.log("disconnect ws")
        this.socket.disconnect();
        this.socket = null;
      }
      this.cameraData = "";
    },
  },
  mounted() {
    this.addUrl();
  },
}
</script>

<style></style>