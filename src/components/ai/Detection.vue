<template>
  <navigation>

    <service-manage 
      serviceName="detection_service" 
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

    <div v-show="this.outputUrls.length > 0 && form.supportInput != InputMode.VIDEO_URL">
      <el-image v-for="(output_url, index) in this.outputUrls" :key="index" :src="output_url" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>
    <div v-show="this.outputUrls.length == 0 && form.supportInput != InputMode.VIDEO_URL && form.supportInput != InputMode.CAMERA">
      <el-image :src="''" class="output-img">
        <div slot="error" class="image-slot">检测结果</div>
      </el-image>
    </div>

    <el-select 
      v-if="form.supportInput == InputMode.CAMERA" v-model="cameraMode" placeholder="请选择传输模式"
      style="margin-bottom: 10px;"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :value="item.value">
      </el-option>
    </el-select>

    <div class="camera-video-container" v-show="form.supportInput === InputMode.CAMERA && cameraMode === CameraMode.WEBRTC_STREAMER">
      <video ref="webrtcStreamerVideo" id="webrtc-streamer-video" v-show="form.supportInput === InputMode.CAMERA" autoplay controls
        disablePictureInPicture controlsList="nodownload nofullscreen" muted>
      </video>
      <div v-if="frames.length > 0">
        <div v-for="(rect, index) in frames[0]" :key="index" class="camera-overlay" :style="{ left: rect.xmin + 'px', top: rect.ymin + 'px', width: rect.w + 'px', height: rect.h + 'px' }">
          <span class="camera-overlay-text">cls{{ rect.label }} conf{{ rect.score }}</span>
        </div>
      </div>
    </div>

    <div class="camera-video-container" v-show="form.supportInput === InputMode.CAMERA && cameraMode === CameraMode.SEI">
      <video ref="mpegtsVideo" id="mpegts-video" autoplay controls
        disablePictureInPicture controlsList="nodownload nofullscreen" muted>
      </video>
      <div v-if="frames.length > 0">
        <div v-for="(rect, index) in frames[0]" :key="index" class="camera-overlay" :style="{ left: rect.xmin + 'px', top: rect.ymin + 'px', width: rect.w + 'px', height: rect.h + 'px' }">
          <span class="camera-overlay-text">cls{{ rect.label }} conf{{ rect.score }}</span>
        </div>
      </div>
    </div>

    <div>
      <video 
        v-show="form.supportInput === InputMode.CAMERA && cameraMode === CameraMode.PYTHON_PUBLISH_STREAM"
        id="jswebrtc" ref="jswebrtc" controls>
      </video>
    </div>

    <video v-show="form.supportInput === InputMode.VIDEO_URL" :src="videoSrc" controls width="auto" height="auto">
    </video>

    <video-progress ref="videoProgress" :progress="videoProgress">
    </video-progress>

    <div style="margin-top: 10px;" v-show="videoJsonSrc != ''">
      <a :href="videoJsonSrc" target="_blank">jsonl文件下载地址</a>
    </div>

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
import mpegts from "@/../public/mpegts.js";
import WebRtcStreamer from '../../../public/webrtcstreamer'
import { webrtcURL } from '@/service.js'
import { JSWebrtc } from "@/../public/jswebrtc.min.js";
import { srsWebrtcURL } from '@/service.js';
import Navigation from '../common/Navigation.vue'
import ServiceManage from '../common/ServiceManage.vue'
import UploadFile from '../common/UploadFile.vue'
import ArgForm from '../common/ArgForm.vue'
import { io } from "socket.io-client"
import VideoProgress from '../common/VideoProgress.vue'
import { CameraMode } from '@/enums/camera_mode.js'
import { InputMode } from '@/enums/input_mode.js'
import { VideoLagMode } from '@/enums/video_lag_mode.js'
export default {
  name: "Detection",
  components: {
    Navigation, UploadFile, ServiceManage, ArgForm,
    VideoProgress
  },
  data() {
    return {
      InputMode: InputMode,
      CameraMode: CameraMode,

      callDisabled: true,
      callLoading: false,
      form: {
        urls: [],
        supportInput: InputMode.SINGLE_PICTURE_URL,
        hyperparameters: [],
        cameraId: 0,
      },
      outputUrls: [],
      videoSrc: "",
      videoJsonSrc: "",
      videoProgress: 0,
      videoTaskDone: false,
      frames: [],
      services: [],
      socket: null,
      cameraVideoPlayed: false,

      webRtcServer: null,
      videoLagMode: VideoLagMode.NONE,
      averageDiffTimestamp: 0,
      ntpRequestTimeMs: 0,
      ntpOffset: 0,

      mpegtsPlayer: null,
      lastEstimateSEITimeStamp: 0,
      cacheBoxes: [],

      jswebrtcPlayer: null,

      cameraMode: CameraMode.WEBRTC_STREAMER,
      options: Object.values(CameraMode).map(value => ({ value })),
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
    modelCall() {
      this.clearResource();
      this.callLoading = true;
      this.outputUrls = [];
      this.frames = [];
      let supportInput = {}
      // console.log(this.form.urls)
      let hyperparameters = this.form.hyperparameters;
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
        let cameraModeHyperparameter = {
          'type': 'string',
          'name': 'camera_mode',
          'value': this.cameraMode,
        }
        hyperparameters = [...this.form.hyperparameters, cameraModeHyperparameter];
      }
      let dto = {
        hyperparameters: hyperparameters,
        supportInput: supportInput,
      };
      this.$axios.post("/model/detection/call", dto).then((res) => {
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
          const namespace = res.data;
          console.log("connect to:", this.$axios.defaults.baseURL + namespace);
          const socket = io(this.$axios.defaults.baseURL + namespace);
          this.socket = socket;
          console.log("success connect ws")
          socket.on('log', (msgs) => {
            for (const msg of msgs) {
              this.$notify({
                title: '调用错误',
                message: msg,
                type: 'warning',
              });
            }
          });
          socket.on('disconnect', () => {
            console.log("disconnect from websocket");
          })

          const cameraMode = this.cameraMode;
          if (cameraMode === CameraMode.WEBRTC_STREAMER) {
            this.webrtcStreamerMode(socket);
          } else if (cameraMode === CameraMode.PYTHON_PUBLISH_STREAM) {
            this.pythonPublishStreamMode(namespace, socket);
          } else if (cameraMode === CameraMode.SEI) {
            this.seiMode(namespace, socket);
          }
          
        } else if (this.form.supportInput == InputMode.VIDEO_URL)  {
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
            this.videoSrc = msgs[0];
            this.videoJsonSrc = msgs[1];
          });
          socket.emit('progress_retrieve', "");
        } else {
          this.outputUrls = res.data.urls;
          if (this.form.supportInput === InputMode.VIDEO_URL) {
            this.videoSrc = this.outputUrls[0];
          }
          this.frames = res.data.frames;
          // console.log(this.outputUrls);
        }
      }).finally(() => {
        if (this.form.supportInput != InputMode.CAMERA) {
          this.callLoading = false;
        }
      });
    },
    webrtcStreamerMode(socket) {
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

      socket.on('time_sync', (serverTimeMs) => {
        this.syncTime(this.ntpRequestTimeMs, serverTimeMs);
        if (this.socket) {
          setTimeout(() => {
            this.intervalSyncTime(socket);
          }, 10000);
        }
      });
      this.intervalSyncTime(socket);

      socket.on('camera_data', async (msg) => {
        if (msg && this.cameraVideoPlayed) {
          const msgJsonObj = JSON.parse(msg);
          const jsonTimestamp = msgJsonObj.timestamp;
          const jsonData = msgJsonObj.data;
          
          let webRtcTimestamp = await this.getWebrtcTimestamp();
          webRtcTimestamp += this.ntpOffset;

          let diffTimestamp = jsonTimestamp - webRtcTimestamp;
          // 使用加权移动平均算法来更新平均差值，防止因瞬时的大延时造成的抖动
          this.averageDiffTimestamp = (this.averageDiffTimestamp * 0.9 + diffTimestamp * 0.1);
          const oriVideoLagMode = this.videoLagMode;
          // 设计三种播放模式，NONE、CACHE_JSON、DELAY_VIDEO
          // NONE：直接将接收到的json画框，并且对视频的播放也不做延迟处理
          // CACHE_JSON：当json的时间戳大于webrtc时间戳时，需要将json缓存起来等待画面播放到对应的时刻再画框
          // DELAY_VIDEO：当json的时间戳小于webrtc时间戳时，需要将画面做相应的延时以对齐json数据
          // 为了防止播放模式在切换阈值处的抖动，这里参考Java Hashmap链表转红黑树的设计，设置了双向的阈值
          switch (this.videoLagMode) {
            case VideoLagMode.NONE:
              if (this.averageDiffTimestamp >= 500) {
                this.videoLagMode = VideoLagMode.CACHE_JSON;
              } else if (this.averageDiffTimestamp <= -500) {
                this.videoLagMode = VideoLagMode.DELAY_VIDEO;
              }
              break;
            case VideoLagMode.CACHE_JSON:
              if (this.averageDiffTimestamp <= 300 && this.averageDiffTimestamp >= -300) {
                this.videoLagMode = VideoLagMode.NONE;
              } else if (this.averageDiffTimestamp < -300) {
                this.videoLagMode = VideoLagMode.DELAY_VIDEO;
              }
              break;
            case VideoLagMode.DELAY_VIDEO:
              if (this.averageDiffTimestamp <= 300 && this.averageDiffTimestamp >= -300) {
                this.videoLagMode = VideoLagMode.NONE;
              } else if (this.averageDiffTimestamp >= 500) {
                this.videoLagMode = VideoLagMode.CACHE_JSON;
              }
              break;
            default:
              console.log("unsupport videoLagMode");
              break;
          }
          if (oriVideoLagMode != this.videoLagMode) {
            console.log("videoLagMode change to " + this.videoLagMode);
            this.frames = [];
            this.cacheBoxes = [];
            this.setWebrtcDelay(0);
          }
          switch (this.videoLagMode) {
            case VideoLagMode.NONE:
              this.frames = [];
              this.frames.push(jsonData);
              break;
            case VideoLagMode.CACHE_JSON:
              this.cacheBoxes.push({
                time: jsonTimestamp,
                data: jsonData,
              });
              if (oriVideoLagMode != this.videoLagMode) {
                this.webrtcStreamerDrawCachedBoxes();
              }
              break;
            case VideoLagMode.DELAY_VIDEO:
              this.frames = [];
              this.frames.push(jsonData);
              this.setWebrtcDelay((webRtcTimestamp - jsonTimestamp) / 1000);
              break;
            default:
              console.log("unsupport videoLagMode");
              break;
          }
        }
      });
    },
    seiMode(namespace, socket) {
      if (!mpegts.getFeatureList().mseLivePlayback) {
        return alert('当前浏览器环境不支持MSE功能，推荐使用Chrome浏览器');
      }
      const mpegtsVideoElement = this.$refs.mpegtsVideo;
      mpegtsVideoElement.addEventListener('play', () => {
        this.callLoading = false;
        this.cameraVideoPlayed = true;
      });
      mpegtsVideoElement.addEventListener('pause', () => {
        this.cameraVideoPlayed = false;
      });
      const mpegtsConfig = {
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 0.9, // 最大缓存时间
        liveBufferLatencyMinRemain: 0.2, // 最小缓存时间
      }
      const mpegtsPlayer = mpegts.createPlayer({
        type: 'flv',  // could also be mpegts, m2ts, flv
        isLive: true,
        url: `http://localhost:8080/live${namespace}.flv` // URL of the live stream
      }, mpegtsConfig);
      this.mpegtsPlayer = mpegtsPlayer;
      mpegtsPlayer.attachMediaElement(mpegtsVideoElement);
      mpegtsPlayer.load();
      mpegts.setSEIFunction(this.sinkSEIFromPlayer);

      this.seiDrawCachedBoxes();

      socket.on('camera_data', (msg) => {
        if (msg) {
          if (this.cameraVideoPlayed) {
            const msgJsonObj = JSON.parse(msg);
            this.sinkSEIFromServer(msgJsonObj.timestamp, msgJsonObj.data);
          }
        }
      });
    },
    pythonPublishStreamMode(namespace, socket) {
      socket.on('camera_data', (msg) => {
        if (msg) {
          if (msg.startsWith('[')) {
            let boxes = JSON.parse(msg);
            if (this.cameraVideoPlayed) {
              this.frames = [];
              this.frames.push(boxes);
            }
          } 
        }
      });
      const videoDom = this.$refs.jswebrtc;
      const webrtcUrl = `${srsWebrtcURL}${namespace}`
      const that = this;

      videoDom.addEventListener('play', () => {
        that.cameraVideoPlayed = true;
        that.callLoading = false;
      })
      videoDom.addEventListener('pause', () => {
        that.cameraVideoPlayed = false;
      })

      this.jswebrtcPlayer = new JSWebrtc.Player(webrtcUrl, {
        video: videoDom,
        autoplay: true,
        onplay: () => {},
      });
    },
    async webrtcStreamerDrawCachedBoxes() {
      if (!this.cameraVideoPlayed || this.videoLagMode != VideoLagMode.CACHE_JSON) {
        return;
      }
      let webRtcTimestamp = await this.getWebrtcTimestamp();
      let shiftCnt = 0;
      let nearDropTime = Number.MAX_SAFE_INTEGER;
      while (this.cacheBoxes.length > 0 && this.cacheBoxes[0].time < webRtcTimestamp) {
        nearDropTime = Math.min(nearDropTime, webRtcTimestamp - this.cacheBoxes[0].time);
        this.cacheBoxes.shift();
        shiftCnt++;
      }
      if (shiftCnt > 0) {
        console.log(`丢弃了${shiftCnt}个box，最短丢弃时间${nearDropTime}`);
      }
      if (this.cacheBoxes.length > 0) {
        const boxes = this.cacheBoxes[0];
        if (boxes.time - webRtcTimestamp <= 200) {
          this.frames = [];
          this.frames.push(boxes.data);
        }
      }
      if (this.cameraVideoPlayed && this.videoLagMode == VideoLagMode.CACHE_JSON) {
        requestAnimationFrame(this.webrtcStreamerDrawCachedBoxes);
      }
    },
    seiDrawCachedBoxes() {
      const passTime = new Date().getTime() - this.localTime;
      const estimateCurrentSEITimeStamp = this.lastEstimateSEITimeStamp + passTime;
      let shiftCnt = 0;
      let nearDropTime = Number.MAX_SAFE_INTEGER;
      while (this.cacheBoxes.length > 0 && this.cacheBoxes[0].time < estimateCurrentSEITimeStamp) {
        nearDropTime = Math.min(nearDropTime, estimateCurrentSEITimeStamp - this.cacheBoxes[0].time);
        this.cacheBoxes.shift();
        shiftCnt++;
      }
      if (shiftCnt > 0) {
        console.log(`丢弃了${shiftCnt}个box，最短丢弃时间${nearDropTime}`);
      }
      if (this.cacheBoxes.length > 0) {
        const boxes = this.cacheBoxes[0];
        if (boxes.time - estimateCurrentSEITimeStamp <= 200) {
          this.frames = [];
          this.frames.push(boxes.data);
        }
      }
      if (this.cameraVideoPlayed) {
        requestAnimationFrame(this.seiDrawCachedBoxes);
      } else {
        this.frames = [];
      }
    },
    sinkSEIFromPlayer(seiMessage, seiTime) {
      // seiTime: number type, seiMessage对应的播放时间，保留两位小数，小数点前为秒，小数点后为毫秒
      // seiMessage: string type, SEI字符串信息，这里为Unix毫秒时间戳
      // currentTime: number type, example: 17.131014，小数点前为秒，小数点后为毫秒
      const seiTimestamp = parseInt(seiMessage);
      const diffTime = this.$refs.mpegtsVideo.currentTime - seiTime;
      const estimateCurrentSEITimeStamp = seiTimestamp + diffTime * 1000; // 估计当前正在播放的画面对应的SEI时间
      this.localTime = new Date().getTime();
      this.lastEstimateSEITimeStamp = estimateCurrentSEITimeStamp;
      // console.log('estimate: ', estimateCurrentSEITimeStamp);
    },
    sinkSEIFromServer(milliSEITimestamp, data) {
      // 在milliSEITimestamp时刻对应的数据是data
      // const nowLocalTime = new Date().getTime();
      // const passTime = nowLocalTime - this.localTime;
      // const estimateCurrentSEITimeStamp = this.lastEstimateSEITimeStamp + passTime; // 估计当前正在播放的画面对应的SEI时间
      // const diffTime = estimateCurrentSEITimeStamp - milliSEITimestamp;
      // console.log(`${diffTime}:`, data);

      // this.frames = [];
      // this.frames.push(data);
      this.cacheBoxes.push({
        time: milliSEITimestamp,
        data: data,
      });
      
    },
    setWebrtcDelay(delay) {
      const [, videoReceiver] = this.webRtcServer.pc.getReceivers();
      videoReceiver.playoutDelayHint = delay;
    },
    async getWebrtcTimestamp() {
      let webRtcTimestamp = 0;
      try {
        this.webRtcServer.pc.getReceivers().forEach(receiver => {
          receiver.getSynchronizationSources().forEach(ssrc => {
            webRtcTimestamp = ssrc.timestamp;
          });
        });
        // const stats = await this.webRtcServer.pc.getStats(null);
        // stats.forEach(report => {
        //     if (report.type === 'inbound-rtp') {
        //         if (report.kind === 'video') {
        //           webRtcTimestamp = report.timestamp;
        //         }
        //     }
        // });
        return webRtcTimestamp;
      } catch (e) {
        console.log("error: ", e);
        return 0;
      }
    },
    intervalSyncTime(socket) {
      this.ntpRequestTimeMs = this.now();
      console.log("emit");
      socket.emit('time_sync_request');
    },
    syncTime(requestTimeMs, serverTimeMs) {
      let now = this.now();
      let offset = ((serverTimeMs - requestTimeMs) + (serverTimeMs - now)) / 2;
      console.log("offset:", offset);
      this.ntpOffset = offset;
    },
    now() {
      return Date.now();
    },
    clearResource() {
      console.log("clear resource...");
      if (this.socket) {
        console.log("disconnect ws");
        this.socket.disconnect();
        this.socket = null;
      }
      if (this.webRtcServer) {
        console.log("disconnect webRtc");
        this.webRtcServer.disconnect();
        this.webRtcServer = null;
        this.$refs.webrtcStreamerVideo.src = "";
      }
      if (this.mpegtsPlayer) {
        this.mpegtsPlayer.pause();
        this.mpegtsPlayer.unload();
        this.mpegtsPlayer.detachMediaElement();
        this.mpegtsPlayer.destroy();
        this.mpegtsPlayer = null;
      }
      if (this.jswebrtcPlayer) {
        this.jswebrtcPlayer.destroy();
        this.jswebrtcPlayer = null;
        this.$refs.jswebrtc.src = "";
      }
      this.outputUrls = [];
      this.videoSrc = "";
      this.videoJsonSrc = "";
      this.videoProgress = 0;
      this.videoTaskDone = false;
      this.frames = [];
    },
  },
  mounted() {
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