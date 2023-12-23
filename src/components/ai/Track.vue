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

    <el-button v-show="form.supportInput === '摄像头输入'" @click="confirmROI">将ROI发送给服务器</el-button>

    <!-- <el-image v-show="form.supportInput === '摄像头输入' && cameraData === ''" :src="''" class="output-img">
        <div slot="error" class="image-slot">摄像头输出</div>
    </el-image> -->
    <!-- <img v-show="form.supportInput === '摄像头输入' && cameraData != ''" :src="cameraData" alt="Image"> -->

    <video v-show="form.supportInput === '视频输入'" :src="outputUrl" controls width="auto" height="auto">
    </video>

    <select-roi :url="roiUrl" :imgSrc="cameraData" :roiSent="roiSent" @roi-event="handleRoiEvent"></select-roi>

    <div v-for="(frame, index) in this.frames" :key="index" style="border: 1px solid; padding: 5px; margin-bottom: 10px;">
      <div style="font-weight: bold; padding-bottom: 30px; padding-top: 10px;">
        {{ 'frame' + index + ':' }}
      </div>
      <el-descriptions :title="''">
        <el-descriptions-item label="x">{{ frame.x }}</el-descriptions-item>
        <el-descriptions-item label="y">{{ frame.y }}</el-descriptions-item>
        <el-descriptions-item label="width">{{ frame.width }}</el-descriptions-item>
        <el-descriptions-item label="height">{{ frame.height }}</el-descriptions-item>
      </el-descriptions>
    </div>

  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue'
import ServiceManage from '../common/ServiceManage.vue'
import UploadFile from '../common/UploadFile.vue'
import ArgForm from '../common/ArgForm.vue'
import SelectRoi from '../common/SelectRoi.vue'
import { io } from "socket.io-client"
export default {
  name: "Track",
  components: {
    Navigation, ServiceManage, UploadFile, ArgForm, SelectRoi, 
  },
  
  data() {
    return {
      callDisabled: true,
      callLoading: false,
      services: [],
      outputUrl: "",
      form: {
        urls: [],
        supportInput: "单张图片输入",
        hyperparameters: [],
        cameraId: 0,
      },
      cameraData: "",
      roi: null,
      frames: [],
      socket: null,
      roiSent: false,
    };
  },
  computed: {
    roiUrl: function() {
      if (this.form.supportInput === '摄像头输入') {
        return "";
      }
      if (this.form.urls.length == 0) {
        return "";
      }
      return this.form.urls[0].value;
    },
  },
  watch: {
    'form.supportInput' () {
      this.clearResource();
    },
  },
  methods: {
    handleRoiEvent(roi) {
      this.roi = roi;
      this.form.hyperparameters.map(e => {
        if (e.name === 'roi_x') {
          e.value = roi.x;
        } else if (e.name === 'roi_y') {
          e.value = roi.y;
        } else if (e.name === 'roi_width') {
          e.value = roi.width;
        } else if (e.name === 'roi_height') {
          e.value = roi.height;
        }
        return e;
      });
    },
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
            if (msg.startsWith('{')) {
              this.frames = [];
              let frame = JSON.parse(msg)
              this.frames.push(frame);
              // console.log(frame);
            } else {
              this.cameraData = "data:image/jpeg;base64," + msg;
            }
            socket.emit('camera_retrieve', "");
          });
        } else {
          this.outputUrl = res.data.url;
          this.frames = res.data.frames;
        }
      }).finally(() => {
        this.callLoading = false;
      });
    },
    confirmROI() {
      if (this.roi === null) {
        this.$message({
          type: 'warning',
          message: '未选择ROI',
        });
      }
      if (this.socket) {
        this.socket.emit('roi_event', JSON.stringify(this.roi));
        this.$message({
          type: 'success',
          message: 'ROI已发送给服务器',
        });
        this.roiSent = true;
      }
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
      this.roiUrl = "";
      this.roiSent = false;
    },
  },
  beforeDestroy() {
    this.clearResource();
  },
};
</script>

<style>

</style>