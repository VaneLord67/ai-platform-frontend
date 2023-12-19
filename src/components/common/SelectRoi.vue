<template>
  <div>
    <div>
      Select ROI:
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
      default: "http://localhost:9000/ai-platform/people_h264.mp4",
    },
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
    getFirstFrame() {
      this.$axios.get("/model/track/first_frame", {
        params: {
          url: this.url,
        }
      }).then((res) => {
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
      this.ctx.drawImage(this.image, 0, 0);
      this.drawSelection();
    },
    drawSelection() {
      if (this.isSelecting) {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.startX, this.startY, this.width, this.height);
      }
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
      console.log('Selected ROI:', this.startX, this.startY, this.width, this.height);
    }
  },

  mounted() {
    this.getFirstFrame();
  },
}
</script>

<style>

</style>