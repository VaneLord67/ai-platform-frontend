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

    <el-image v-show="form.supportInput === '摄像头输入' && cameraData === ''" :src="''" class="output-img">
        <div slot="error" class="image-slot">摄像头输出</div>
    </el-image>
    <img v-show="form.supportInput === '摄像头输入' && cameraData != ''" :src="cameraData" alt="Image">

    <video v-show="form.supportInput === '视频输入'" :src="outputUrl" controls width="auto" height="auto">
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
        <el-descriptions-item label="left">{{ box.left }}</el-descriptions-item>
        <el-descriptions-item label="right">{{ box.right }}</el-descriptions-item>
        <el-descriptions-item label="bottom">{{ box.bottom }}</el-descriptions-item>
        <el-descriptions-item label="top">{{ box.top }}</el-descriptions-item>
        <el-descriptions-item label="confidence">{{ box.confidence }}</el-descriptions-item>
        <el-descriptions-item label="class_name">{{ box.class_name }}</el-descriptions-item>
        <el-descriptions-item label="track_id">{{ box.track_id }}</el-descriptions-item>
      </el-descriptions>
    </div>

  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue'
import ServiceManage from '../common/ServiceManage.vue'
import UploadFile from '../common/UploadFile.vue'
import ArgForm from '../common/ArgForm.vue'
import { io } from "socket.io-client"
import VideoProgress from '../common/VideoProgress.vue'
export default {
  name: "Track",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm,
    VideoProgress, 
  },
  
  data() {
    return {
      callDisabled: true,
      callLoading: false,
      services: [],
      outputUrl: "",
      form: {
        urls: [],
        supportInput: "视频输入",
        hyperparameters: [],
        cameraId: 0,
      },

      videoJsonSrc: "",
      videoProgress: 0,
      videoTaskDone: false,

      cameraData: "",
      frames: [],
      socket: null,
    };
  },
  computed: {
  },
  watch: {
    'form.supportInput' () {
      this.clearResource();
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
        if (this.form.supportInput == "摄像头输入") {
          let namespace = res.data;
          console.log("connect to:", this.$axios.defaults.baseURL + namespace);
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws");
          socket.emit('camera_retrieve', "");
          socket.on('camera_log', (msgs) => {
            for (const msg of msgs) {
              this.$notify({
                title: '调用错误',
                message: msg,
                type: 'warning',
              });
            }
          });
          socket.on('camera_data', (msg) => {
            if (msg == '') {
              socket.emit('camera_retrieve', "");
              return;
            }
            if (msg.startsWith('[')) {
              this.frames = [];
              let frame = JSON.parse(msg)
              this.frames.push(frame);
              // console.log(frame);
            } else {
              this.cameraData = "data:image/jpeg;base64," + msg;
            }
            socket.emit('camera_retrieve', "");
          });
        } else if (this.form.supportInput == "视频输入") {
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
      this.outputUrl = "";
      this.frames = [];

      this.outputUrl = "";
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
</style>