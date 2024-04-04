<template>
  <navigation>

    <service-manage serviceName="track_service" 
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
    @support-input-event="modelCall"
    @close-camera-event="handleCloseCameraEvent"
    ></arg-form>

    <WebrtcStreamerContainer 
      ref="webrtcStreamerContainer"
      @camera_data="handleCameraDataEvent" 
      @play="handleWebrtcStreamerPlayEvent"
      v-show="form.supportInput === InputMode.CAMERA"
    >
      <div v-if="frames.length > 0">
        <div v-for="(rect, index) in frames[0]" :key="index" class="camera-overlay" :style="{ left: rect.xmin + 'px', top: rect.ymin + 'px', width: rect.w + 'px', height: rect.h + 'px' }">
          <span class="camera-overlay-text">cls{{ rect.label }} conf{{ rect.score }} track_id{{ rect.track_id }}</span>
        </div>
      </div>
    </WebrtcStreamerContainer>

    <VideoContainer ref="videoContainer" v-show="form.supportInput === InputMode.VIDEO_URL">
    </VideoContainer>

    <div v-for="(frame, index) in this.frames" :key="index" style="border: 1px solid; padding: 5px; margin-bottom: 10px;">
      <div style="font-weight: bold; padding-bottom: 30px; padding-top: 10px;">
        {{ 'frame' + index + ':' }}
      </div>
      <el-descriptions :title="'box' + boxIndex + ':'" v-for="(box, boxIndex) in frame" :key="boxIndex">
        <el-descriptions-item :label="boxKey" v-for="(boxValue, boxKey, boxKeyIndex) in box" :key="boxKeyIndex">{{ boxValue }}</el-descriptions-item>
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
  name: "Track",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm,
    WebrtcStreamerContainer, VideoContainer,
  },
  
  data() {
    return {
      InputMode: InputMode,

      callDisabled: true,
      callLoading: false,
      services: [],
      form: {
        urls: [],
        supportInput: InputMode.VIDEO_URL,
        hyperparameters: [],
        cameraId: 0,
      },

      frames: [],
    };
  },
  computed: {
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
  methods: {
    handleCloseCameraEvent() {
      this.clearResource();
    },
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
      this.$axios.post("/model/track/call", dto, {
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
        }
      }).finally(() => {
        if (this.form.supportInput === InputMode.VIDEO_URL) {
          this.callLoading = false;
        }
      });
    },
    clearResource() {
      this.$refs.webrtcStreamerContainer.clearResource();
      this.$refs.videoContainer.clearResource();

      this.frames = [];
    },
  },
  beforeDestroy() {
    this.clearResource();
  },
};
</script>

<style scoped>

.camera-overlay {
  position: absolute;
  border: 2px solid red;
  box-sizing: border-box;
}

.camera-overlay-text {
  position: absolute;
  top: -20px;
  left: 0px;
  color: green;
}
</style>