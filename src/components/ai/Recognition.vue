<template>
  <navigation>

    <service-manage serviceName="recognition_service" 
    @call-disabled-event="handleCallDisabledEvent"
    @hyperparameter-event="handleHyperparameterEvent"
    @services-event="handleServicesEvent"
    ></service-manage>

    <div style="font-weight: bold; padding-top: 20px; padding-bottom: 20px;">
      上传
    </div>
    <UploadFile></UploadFile>

    <arg-form 
    :callDisabled="callDisabled"
    :callLoading="callLoading"
    :services="services"
    :form="form"
    @close-camera-event="handleCloseCameraEvent"
    @support-input-event="modelCall"
    ></arg-form>

    <div v-show="form.supportInput != InputMode.VIDEO_URL && form.supportInput != InputMode.CAMERA">
      <el-image v-for="(output_url, index) in this.outputUrls" :key="index" :src="output_url" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
      <el-image v-show="this.frames.length == 0" :src="''" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>

    <WebrtcStreamerContainer 
      ref="webrtcStreamerContainer"
      @camera_data="handleCameraDataEvent" 
      @play="handleWebrtcStreamerPlayEvent"
      v-show="form.supportInput === InputMode.CAMERA"
    >
    </WebrtcStreamerContainer>

    <VideoContainer ref="videoContainer" v-show="form.supportInput === InputMode.VIDEO_URL">
    </VideoContainer>

    <div v-for="(frame, index) in this.frames" :key="index"
      style="border: 1px solid; padding: 5px; margin-bottom: 10px;">
      <div style="font-weight: bold; padding-bottom: 30px; padding-top: 10px;">
        {{ 'frame' + index + ':' }}
      </div>
      <el-descriptions :title="'box' + boxIndex + ':'" v-for="(box, boxIndex) in frame" :key="boxIndex">
        <el-descriptions-item :label="boxKey" v-for="(boxValue, boxKey, boxKeyIndex) in box" :key="boxKeyIndex">{{
          boxValue }}</el-descriptions-item>
      </el-descriptions>
    </div>

  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue'
import ServiceManage from '../common/ServiceManage.vue'
import UploadFile from '../common/UploadFile.vue'
import ArgForm from '../common/ArgForm.vue'
import WebrtcStreamerContainer from '../common/WebrtcStreamerContainer.vue'
import VideoContainer from '../common/VideoContainer.vue'
import { InputMode } from '@/enums/input_mode.js'
export default {
  name: "Recognition",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm,
    WebrtcStreamerContainer, VideoContainer,
  },
  
  data() {
    return {
      InputMode: InputMode,

      frames: [],
      callDisabled: true,
      callLoading: false,
      services: [],
      outputUrls: "",
      form: {
        urls: [],
        supportInput: InputMode.SINGLE_PICTURE_URL,
        hyperparameters: [],
        cameraId: 0,
      },
    };
  },
  watch: {
    'form.supportInput' () {
      this.clearResource();
      this.form.urls = [];
      this.form.urls.push({
        value: '',
        key: Date.now(),
      });
    },
  },
  computed: {
  },
  methods: {
    handleCallDisabledEvent(callDisabled) {
      this.callDisabled = callDisabled;
    },
    handleHyperparameterEvent(hyperparameters) {
      this.form.hyperparameters = hyperparameters;
    },
    handleServicesEvent(services) {
      this.services = services;
    },
    handleCameraDataEvent(msgJsonObj) {
      const jsonData = msgJsonObj.data;
      this.frames = [];
      this.frames.push(jsonData);
    },
    handleWebrtcStreamerPlayEvent() {
      this.callLoading = false;
    },
    modelCall(supportInput) {
      this.clearResource();
      this.callLoading = true;
      let dto = {
        hyperparameters: this.form.hyperparameters,
        supportInput: supportInput,
      };
      this.$axios.post("/model/recognition/call", dto, {
        timeout: 60000,
      }).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: "warning",
            message: "调用失败!",
          });
          if (res && res.message) {
            this.$notify({
              title: '调用错误',
              message: res.message,
              type: 'warning',
            });
          }
          return;
        }
        if (this.form.supportInput == InputMode.CAMERA) {
          this.$refs.webrtcStreamerContainer.activate(res.data, this.form.cameraId);
        } else if (this.form.supportInput == InputMode.VIDEO_URL) {
          this.$refs.videoContainer.activate(res.data);
        } else {
          this.frames = res.data.frames;
          this.outputUrls = [];
          this.form.urls.forEach(e => {
            this.outputUrls.push(e.value);
          });
        }
      }).finally(() => {
        if (this.form.supportInput != InputMode.CAMERA) {
          this.callLoading = false;
        }
      });
    },
    handleCloseCameraEvent() {
      this.clearResource();
    },
    clearResource() {
      this.$refs.webrtcStreamerContainer.clearResource();
      this.$refs.videoContainer.clearResource();

      this.outputUrls = [];
      this.frames = [];
    },
  },
  beforeDestroy() {
    this.clearResource();
  },
};
</script>

<style>
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