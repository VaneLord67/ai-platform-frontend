<template>
  <div>
    <div style="font-weight: bold; padding-top: 20px; padding-bottom: 20px; margin-top: 40px">
      测试模拟
    </div>

    <div class="flex-container">
      <el-form ref="form" :model="form" class="input-form">

        <div v-show="form.supportInput != InputMode.CAMERA">
          url
          <el-form-item v-for="(url, index) in form.urls" :label="url.name" :key="url.key"
            :prop="'urls.' + index + '.value'">
            <el-input v-model="url.value"></el-input>
          </el-form-item>
        </div>

        <el-form-item v-show="form.supportInput === InputMode.CAMERA" label="摄像头id">
          <el-input v-model="form.cameraId"></el-input>
        </el-form-item>

        <el-form-item v-for="(hyperparameter, index) in form.hyperparameters" :label="hyperparameter.name"
          :key="hyperparameter.key" :prop="'hyperparameters.' + index + '.value'">
          <el-input v-model="hyperparameter.value"></el-input>
        </el-form-item>

        <el-form-item label="输入形式">
          <el-radio-group v-model="form.supportInput">
            <el-radio v-bind:disabled="!singlePictureSupport" :label="InputMode.SINGLE_PICTURE_URL"></el-radio>
            <el-radio v-bind:disabled="!multiplePictureSupport" :label="InputMode.MULTIPLE_PICTURE_URL"></el-radio>
            <el-radio v-bind:disabled="!videoSupport" :label="InputMode.VIDEO_URL"></el-radio>
            <el-radio v-bind:disabled="!cameraSupport" :label="InputMode.CAMERA"></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="initSupportInput" :loading="callLoading" :disabled="callDisabled">{{ callButtonText
          }}</el-button>
          <el-button v-show="form.supportInput === InputMode.MULTIPLE_PICTURE_URL" @click="addUrl">新增图片url</el-button>
          <el-button v-show="form.supportInput === InputMode.CAMERA" @click="closeCamera">关闭摄像头</el-button>
        </el-form-item>
      </el-form>
    </div>


  </div>
</template>

<script>
import { InputMode } from '@/enums/input_mode.js'
export default {
  name: 'ArgForm',
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
    form: {
      type: Object,
      default: function() {
        return {};
      }
    },
  },
  data() {
    return {
      InputMode: InputMode,
    }
  },
  computed: {
    callButtonText: function() {
      if (this.callDisabled) {
        return "无正在运行实例，不可调用";
      }
      if (this.form.supportInput === InputMode.CAMERA) {
        return "开启摄像头";
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
      if (this.form.supportInput == InputMode.SINGLE_PICTURE_URL) {
        supportInput.type = "single_picture_url";
        supportInput.value = this.form.urls[0].value.trim();
      } else if (this.form.supportInput == InputMode.MULTIPLE_PICTURE_URL) {
        supportInput.type = "multiple_picture_url";
        supportInput.value = this.form.urls.map(v => v.value.trim());
      } else if (this.form.supportInput == InputMode.VIDEO_URL) {
        supportInput.type = "video_url";
        supportInput.value = this.form.urls[0].value.trim();
      } else if (this.form.supportInput == InputMode.CAMERA) {
        supportInput.type = "camera";
        supportInput.value = this.form.cameraId;
      }
      this.$emit('support-input-event', supportInput);
    },
    closeCamera() {
      this.$emit("close-camera-event");
    },
  },
  mounted() {
    this.addUrl();
  },
}
</script>

<style>
.flex-container {
  display: flex;
}

.input-form {
  width: 48%;
  margin-right: 50px;
}
</style>