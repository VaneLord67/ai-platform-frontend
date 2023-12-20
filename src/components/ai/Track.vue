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
    ></arg-form>

    <el-image v-show="form.supportInput === '摄像头输入' && cameraData === ''" :src="''" class="output-img">
        <div slot="error" class="image-slot">摄像头输出</div>
    </el-image>
    <img v-show="form.supportInput === '摄像头输入' && cameraData != ''" :src="cameraData" alt="Image">

    <video v-show="form.supportInput === '视频输入'" :src="outputUrl" controls width="auto" height="auto">
    </video>

    <select-roi :url="roiUrl" @roi-event="handleRoiEvent"></select-roi>

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
      roi: {},
    };
  },
  computed: {
    roiUrl: function() {
      if (this.form.urls.length == 0) {
        return "";
      }
      return this.form.urls[0].value;
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
      this.form = form;
      // console.log("form =>", form);
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
          return;
        }
        if (this.form.supportInput == "摄像头输入") {
          let namespace = res.data;
          console.log("connect to:", this.$axios.defaults.baseURL + namespace)
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws")
          socket.emit('camera_retrieve', "");
          socket.on('camera_data', (msg) => {
            this.cameraData = "data:image/jpeg;base64," + msg;
            // console.log("receive msg:" + this.cameraData);
            socket.emit('camera_retrieve', "");
          });
        } else {
          this.outputUrl = res.data.url;
          this.frames = res.data.frames;
        }
      }).finally(() => {
        this.callLoading = false;
      });
    }
  },
};
</script>

<style>

</style>