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

    <div class="camera-video-container" v-show="form.supportInput === InputMode.CAMERA">
      <video ref="webrtcStreamerVideo" id="webrtc-streamer-video" v-show="form.supportInput === InputMode.CAMERA" autoplay controls
        disablePictureInPicture controlsList="nodownload nofullscreen" muted>
      </video>
      <div v-if="frames.length > 0">
        <div v-for="(rect, index) in frames[0]" :key="index" class="camera-overlay" :style="{ left: rect.xmin + 'px', top: rect.ymin + 'px', width: rect.w + 'px', height: rect.h + 'px' }">
          <span class="camera-overlay-text">cls{{ rect.label }} conf{{ rect.score }} track_id{{ rect.track_id }}</span>
        </div>
      </div>
    </div>

    <video v-show="form.supportInput === InputMode.VIDEO_URL" :src="outputUrl" controls width="auto" height="auto">
    </video>

    <video-progress
      ref="videoProgress"
      :progress="videoProgress" 
    >
    </video-progress>

    <div style="margin-top: 10px;" v-show="videoJsonSrc != ''">
      <a :href="videoJsonSrc" target="_blank">jsonl文件下载地址</a>
    </div>

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
import WebRtcStreamer from '../../../public/webrtcstreamer'
import { webrtcURL } from '@/service.js'
import Navigation from '../common/Navigation.vue'
import ServiceManage from '../common/ServiceManage.vue'
import UploadFile from '../common/UploadFile.vue'
import ArgForm from '../common/ArgForm.vue'
import { io } from "socket.io-client"
import VideoProgress from '../common/VideoProgress.vue'
import { InputMode } from '@/enums/input_mode.js'
export default {
  name: "Track",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm,
    VideoProgress, 
  },
  
  data() {
    return {
      InputMode: InputMode,

      callDisabled: true,
      callLoading: false,
      services: [],
      outputUrl: "",
      form: {
        urls: [],
        supportInput: InputMode.VIDEO_URL,
        hyperparameters: [],
        cameraId: 0,
      },

      videoJsonSrc: "",
      videoProgress: 0,
      videoTaskDone: false,

      cameraData: "",
      frames: [],
      socket: null,

      webRtcServer: null,
      cameraVideoPlayed: false,
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
    handleFormEvent(form) {
      if (form.supportInput != this.form.supportInput) {
        this.cameraData = "";
        this.outputUrl = "";
        this.frames = [];
      }
      this.form = form;
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
          let namespace = res.data;

          const videoElement = this.$refs.webrtcStreamerVideo;
          videoElement.addEventListener('play', () => {
            this.cameraVideoPlayed = true;
            this.callLoading = false;
          });
          videoElement.addEventListener('pause', () => {
            this.cameraVideoPlayed = false;
          });

          this.webRtcServer = new WebRtcStreamer('webrtc-streamer-video', webrtcURL);
          this.webRtcServer.connect(this.form.cameraId);

          console.log("connect to:", this.$axios.defaults.baseURL + namespace);
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws");
          socket.on('log', (msgs) => {
            for (const msg of msgs) {
              this.$notify({
                title: '调用错误',
                message: msg,
                type: 'warning',
              });
            }
          });
          socket.on('camera_data', async (msg) => {
            if (msg && this.cameraVideoPlayed) {
              const msgJsonObj = JSON.parse(msg);
              const jsonData = msgJsonObj.data;
              this.frames = [];
              this.frames.push(jsonData);
            }
          });
        } else if (this.form.supportInput == InputMode.VIDEO_URL) {
          this.$refs.videoProgress.dialogOpen();
          this.videoProgressVisible = true;
          let namespace = res.data;
          console.log("connect to:", this.$axios.defaults.baseURL + namespace);
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws")
          socket.on('video_log', (msgs) => {
            for (const msg of msgs) {
              this.$notify({
                title: '调用错误',
                message: msg,
                type: 'warning',
              });
            }
          });
          socket.on('progress_data', (msg) => {
            this.videoProgress = Math.floor(Number(msg) * 100);
            if (!this.videoTaskDone) {
              socket.emit('progress_retrieve', "");
            }
          });
          socket.on('video_task_done', (msgs) => {
            this.videoTaskDone = true;
            this.$refs.videoProgress.dialogClose();
            if (msgs.length != 2) {
              console.log("video task package length error");
              return;
            }
            this.outputUrl = msgs[0];
            this.videoJsonSrc = msgs[1];
          });
          socket.emit('progress_retrieve', "");
        } else {
          this.outputUrl = res.data.url;
          this.frames = res.data.frames;
        }
      }).finally(() => {
        this.callLoading = false;
      });
    },
    clearResource() {
      if (this.socket) {
        console.log("disconnect ws");
        this.socket.disconnect();
        this.socket = null;
        this.cameraData = "";
      }
      if (this.webRtcServer) {
        console.log("disconnect webRtc");
        this.webRtcServer.disconnect();
        this.webRtcServer = null;
        this.$refs.webrtcStreamerVideo.src = "";
      }
      this.outputUrl = "";
      this.frames.splice(0, this.frames.length); // Vue响应式清空数组

      this.videoJsonSrc = "";
      this.videoProgress = 0;
      this.videoTaskDone = false;

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

.camera-video-container {
  position: relative;
}

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