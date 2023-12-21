<template>
  <div>
    <div>
      <el-button v-show="url != ''" type="primary" @click="clickRoiButton">点此进行ROI选择:</el-button>
    </div>
    <canvas ref="canvas"
    @mousedown="startSelection"
    @mousemove="updateSelection"
    @mouseup="endSelection">
    </canvas>
  </div>
</template>

<script>
export default {
  name: 'SelectRoi',
  props: {
    url: {
      type: String,
      default: "",
    },
    imgSrc: {
      type: String,
      default: "",
    },
    roiSent: {
      type: Boolean,
      default: false,
    }
  },
  watch: {
    imgSrc(newVal) {
      this.image.src = newVal;
      // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this.ctx.drawImage(this.image, 0, 0);
      // this.ctx.strokeStyle = 'red';
      // this.ctx.lineWidth = 2;
      // this.ctx.strokeRect(this.startX, this.startY, this.width, this.height);
      if (newVal == '') {
        // this.ctx.drawImage(this.image, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  },
  data() {
    return {
      firstFrameJPEGText: "",
      canvas: null,
      ctx: null,
      image: null,
      isSelecting: false,
      startX: 0,
      startY: 0,
      width: 0,
      height: 0,
    }
  },
  methods: {
    initCanvas() {
      this.canvas = this.$refs.canvas;
      this.ctx = this.canvas.getContext('2d');
      
      this.image = new Image();
      this.image.crossOrigin = 'anonymous';
      this.image.src = this.imgSrc;

      this.image.onload = () => {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.drawOnCanvas();
      };
    },
    clickRoiButton() {
      if (this.url == "") {
        this.$message({
          type: "warning",
          message: "未填写视频url!",
        });
      }
      this.getFirstFrame();
    },
    getFirstFrame() {
      this.$axios.get("/model/track/first_frame", {
        params: {
          url: this.url,
        }
      }).then((res) => {
        if (res && !res.data) {
          this.$message({
              type: 'warning',
              message: "获取第一帧图像失败",
            }
          )
        }

        this.firstFrameJPEGText = res.data;
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.src = "data:image/jpeg;base64," + this.firstFrameJPEGText;

        this.image.onload = () => {
          this.canvas.width = this.image.width;
          this.canvas.height = this.image.height;
          this.drawOnCanvas();
        };

      })
    },
    drawOnCanvas() {
      // console.log("draw on canvas");
      this.ctx.drawImage(this.image, 0, 0);
      if (!this.roiSent) {
        this.drawSelection();
      }
    },
    drawSelection() {
      // if (this.isSelecting) {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.startX, this.startY, this.width, this.height);
      // }
    },
    startSelection(event) {
      this.isSelecting = true;
      this.startX = event.clientX - this.canvas.getBoundingClientRect().left;
      this.startY = event.clientY - this.canvas.getBoundingClientRect().top;
    },
    updateSelection(event) {
      if (!this.isSelecting) return;

      const currentX = event.clientX - this.canvas.getBoundingClientRect().left;
      const currentY = event.clientY - this.canvas.getBoundingClientRect().top;

      this.width = currentX - this.startX;
      this.height = currentY - this.startY;

      // Clear the canvas and redraw the image
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawOnCanvas();
    },
    endSelection() {
      this.isSelecting = false;
      // console.log('Selected ROI:', this.startX, this.startY, this.width, this.height);
      let roi = {
        x: Math.round(this.startX),
        y: Math.round(this.startY),
        width: Math.round(this.width),
        height: Math.round(this.height),
      }
      this.$emit('roi-event', roi);
    }
  },

  mounted() {
    // this.getFirstFrame();
    this.initCanvas();
  },
}
</script>

<style>

</style>