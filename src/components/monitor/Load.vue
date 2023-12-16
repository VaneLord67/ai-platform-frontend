<template>
  <navigation>
    <div class="load-flex-container">
      <div class="load-container">
        <p class="load-text">CPU负载</p>
        <el-progress type="circle" :percentage="load.cpuPercent"></el-progress>
      </div>
      <div class="load-container">
        <p class="load-text">GPU负载</p>
        <el-progress type="circle" :percentage="load.gpuPercent"></el-progress>
      </div>
      <div class="load-container">
        <p class="load-text">内存负载</p>
        <el-progress type="circle" :percentage="load.memoryPercent"></el-progress>
      </div>
    </div>
  </navigation>
</template>

<script>
import Navigation from "../common/Navigation.vue";
export default {
  name: "Monitor",
  components: {
    Navigation,
  },
  computed: {
    cpuLoadProgressStatus: function() {
      return this.computeLoadProgressStatus(this.load.cpuPercent);
    },
    gpuLoadProgressStatus: function() {
      return this.computeLoadProgressStatus(this.load.gpuPercent);
    },
    memoryLoadProgressStatus: function() {
      return this.computeLoadProgressStatus(this.load.memoryPercent);
    }
  },

  data() {
    return {
      load: {
        cpuPercent: 0,
        memoryPercent: 0,
        gpuPercent: 0,
      },
    };
  },

  methods: {
    computeLoadProgressStatus(loadValue) {
      if (loadValue < 0.7) {
        return "success";
      }
      if (loadValue < 0.95) {
        return "warning";
      }
      return "exception";
    },
    getLoadData() {
      this.$axios.get('/monitor/load').then((res) => {
        if (res && res.data) {
          this.load.cpuPercent = parseFloat(res.data.cpu_percent.toFixed(2));
          this.load.gpuPercent = parseFloat(res.data.gpu_percent[0].toFixed(2));
          this.load.memoryPercent = parseFloat(res.data.memory_percent.toFixed(2));
        }
      });
    }
  },

  mounted() {
    this.getLoadData();
  },
}
</script>

<style>
.load-flex-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: 6%;
  padding-left: 20%;
}
.load-container {
  padding: 50px;
}
.load-text {
  padding-left: 30px;
}
</style>