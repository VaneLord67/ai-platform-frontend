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
    :socket="socket"
    :form="form"
    @close-camera-event="handleCloseCameraEvent"
    @support-input-event="modelCall"
    ></arg-form>

    <div v-show="this.frames.length > 0 && form.supportInput != '视频输入'">
      <el-image v-for="(output_url, index) in this.outputUrls" :key="index" :src="output_url" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>
    <div v-show="this.frames.length == 0 && form.supportInput != '视频输入' && form.supportInput !='摄像头输入'">
      <el-image :src="''" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>

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
      <el-descriptions :title="''">
        <el-descriptions-item label="类别">{{ frame.class_name }}</el-descriptions-item>
        <el-descriptions-item label="置信度">{{ frame.confidence }}</el-descriptions-item>
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
  name: "Recognition",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm,
    VideoProgress, 
  },
  
  data() {
    return {
      frames: [],
      callDisabled: true,
      callLoading: false,
      services: [],
      outputUrls: "",
      outputUrl: "",
      form: {
        urls: [],
        supportInput: "单张图片输入",
        hyperparameters: [],
        cameraId: 0,
      },

      videoJsonSrc: "",
      videoProgress: 0,
      videoTaskDone: false,

      cameraData: "",
      socket: null,
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
        if (this.form.supportInput == "摄像头输入") {
          let namespace = res.data;
          console.log("connect to:", this.$axios.defaults.baseURL + namespace)
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws")
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
            if (msg.startsWith('{')) {
              this.frames = [];
              let frame = JSON.parse(msg)
              this.frames.push(frame);
              // console.log(msg.class_name, msg.confidence);
              // console.log('frames:', this.frames);
            } else {
              this.cameraData = "data:image/jpeg;base64," + msg;
              // console.log("receive msg:" + this.cameraData);
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
          this.frames = res.data.frames;
          this.outputUrls = [];
          this.form.urls.forEach(e => {
            this.outputUrls.push(e.value);
          });
          if (this.outputUrls.length > 0) {
            this.outputUrl = this.outputUrls[0];
          }
        }
      }).finally(() => {
        this.callLoading = false;
      });
    },
    handleCloseCameraEvent() {
      this.clearResource();
    },
    clearResource() {
      if (this.socket) {
        console.log("disconnect ws");
        this.socket.disconnect();
        this.socket = null;
        this.cameraData = "";
      }
      this.outputUrls = [];
      this.outputUrl = "";
      this.videoSrc = "";
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