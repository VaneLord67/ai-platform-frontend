<template>
    <navigation>
      <!-- <h1>测试模拟</h1>
      <el-upload
        class="upload-demo"
        action="https://jsonplaceholder.typicode.com/posts/"
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :file-list="fileList"
        list-type="picture"
      >
        <el-button size="small" type="primary">点击上传</el-button>
        <div slot="tip" class="el-upload__tip">
          只能上传jpg/png文件，且不超过500kb
        </div>
      </el-upload> -->
      <img id="image" :src="imgSrc" alt="Image">
    </navigation>
</template>
  
<script>
import Navigation from '../common/Navigation.vue'
import { io } from "socket.io-client"
export default {
  name: "Detection",
  components: {
    Navigation,
  },
  data() {
    return {
      imgSrc: "data:image/jpeg;base64,",
      fileList: [
        {
          name: "food.jpeg",
          url: "https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100",
        },
        {
          name: "food2.jpeg",
          url: "https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100",
        },
      ],
    };
  },
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    getImgSrc() {
      this.$axios.get('/model/detection/imgSrc').then((res) => {
        this.imgSrc = "data:image/jpeg;base64," + res.data;
      });
    },
    initWebSocket () {
      const socket = io("http://localhost:8086/test");
      this.socket = socket;
      socket.emit('camera_retrieve', "");
      socket.on('camera_data', (msg) => {
        // console.log("receive msg");
        this.imgSrc = "data:image/jpeg;base64," + msg;
        socket.emit('camera_retrieve', "");
      });
    },
  },

  mounted() {
    // this.getImgSrc();
    this.initWebSocket();
  },

  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style>
.upload-demo {
  margin-right: 40%;
}
</style>