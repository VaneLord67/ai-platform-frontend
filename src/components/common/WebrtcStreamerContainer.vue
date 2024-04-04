<template>
  <div class="camera-video-container">
    <video ref="webrtcStreamerVideo" id="webrtc-streamer-video" autoplay controls
      disablePictureInPicture controlsList="nodownload nofullscreen" muted>
    </video>
    <slot></slot>
  </div>
</template>

<script>
import WebRtcStreamer from '@/../public/webrtcstreamer'
import { webrtcURL } from '@/service.js'
import { io } from "socket.io-client"
export default {
    name: "WebrtcStreamerContainer",
    components: {},
    data() {
      return {
        socket: null,
        webRtcServer: null,
        cameraVideoPlayed: false,
      };
    },
    methods: {
      clearResource() {
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
      },
      activate(namespace, cameraURL) {
        const videoElement = this.$refs.webrtcStreamerVideo;
        videoElement.addEventListener('play', () => {
          this.cameraVideoPlayed = true;
          this.$emit("play");
        });
        videoElement.addEventListener('pause', () => {
          this.cameraVideoPlayed = false;
        });

        this.webRtcServer = new WebRtcStreamer('webrtc-streamer-video', webrtcURL);
        this.webRtcServer.connect(cameraURL);

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
            this.$emit('camera_data', msgJsonObj);
          }
        });
      },
    },

};
</script>

<style scoped>

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