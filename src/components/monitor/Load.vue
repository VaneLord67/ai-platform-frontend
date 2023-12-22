<template>
  <navigation>
    <div v-loading="load.loading" element-loading-text="数据加载中"
      element-loading-spinner="el-icon-loading"
      class="load-flex-container">
      <div class="load-container">
        <p class="load-text">CPU负载</p>
        <el-progress type="dashboard" :percentage="load.cpuPercent" :color="colors"></el-progress>
      </div>
      <div class="load-container">
        <p class="load-text">GPU负载</p>
        <el-progress type="dashboard" :percentage="load.gpuPercent" :color="colors"></el-progress>
      </div>
      <div class="load-container">
        <p class="load-text">内存负载</p>
        <el-progress type="dashboard" :percentage="load.memoryPercent" :color="colors"></el-progress>
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
        loading: true,
      },
      colors: [
        {color: '#2892FF', percentage: 20},
        {color: '#2892FF', percentage: 40},
        {color: '#2892FF', percentage: 60},
        {color: '#FF0F0F', percentage: 70},
        {color: '#FF0F0F', percentage: 100}
      ]
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
          this.load.loading = false;
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