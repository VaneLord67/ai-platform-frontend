<template>
  <div style="display: None;"></div>
</template>

<script>
export default {
  name: 'LoadNotification',
  data() {
    return {
      load: {
        cpuPercent: 0,
        memoryPercent: 0,
        gpuPercent: 0,
      },
    }
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
    getLoadDataAndNotify() {
      this.$axios.get('/monitor/load').then((res) => {
        if (res && res.data) {
          this.load.cpuPercent = parseFloat(res.data.cpu_percent.toFixed(2));
          this.load.gpuPercent = parseFloat(res.data.gpu_percent[0].toFixed(2));
          this.load.memoryPercent = parseFloat(res.data.memory_percent.toFixed(2));

          if (this.computeLoadProgressStatus(this.load.cpuPercent) != "success") {
            this.$notify({
              title: '硬件资源警告',
              message: 'CPU负载过高',
              type: 'warning'
            });
          }
          if (this.computeLoadProgressStatus(this.load.gpuPercent) != "success") {
            this.$notify({
              title: '硬件资源警告',
              message: 'GPU负载过高',
              type: 'warning'
            });
          }
          if (this.computeLoadProgressStatus(this.load.memoryPercent) != "success") {
            this.$notify({
              title: '硬件资源警告',
              message: '内存负载过高',
              type: 'warning'
            });
          }
        }
      });
    }
  },
  mounted() {
    this.getLoadDataAndNotify();
  },
}
</script>

<style>

</style>