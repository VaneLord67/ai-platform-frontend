<template>
  <div>
    <video :src="videoURL" controls width="auto" height="auto">
    </video>

    <video-progress
      ref="videoProgress"
      :progress="videoProgress" 
    >
    </video-progress>

    <div style="margin-top: 10px;" v-show="videoJsonSrc != ''">
      <a :href="videoJsonSrc" target="_blank">jsonl文件下载地址</a>
    </div>
  </div>
</template>

<script>
import VideoProgress from './VideoProgress.vue';
import { io } from "socket.io-client"
export default {
  name: "VideoContainer",
  components: {
    VideoProgress, 
  },
  props: {
  },
  data() {
    return {
      socket: null,
      videoURL: "",
      videoJsonSrc: "",
      videoTaskDone: false,
      videoProgress: 0.00,
    };
  },
  methods: {
    clearResource() {
      if (this.socket) {
        console.log("disconnect ws");
        this.socket.disconnect();
        this.socket = null;
      }
      this.videoURL = "";
      this.videoJsonSrc = "";
      this.videoTaskDone = false;
      this.videoProgress = 0;
    },
    activate(namespace) {
      this.$refs.videoProgress.dialogOpen();
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
        this.videoURL = msgs[0];
        this.videoJsonSrc = msgs[1];
      });
      socket.emit('progress_retrieve', "");
    },
  },

};
</script>

<style scoped>

</style>