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
      if (loadValue < 70) {
        return "success";
      }
      if (loadValue < 95) {
        return "warning";
      }
      return "exception";
    },
    getLoadDataAndNotify() {
      this.$axios.get('/monitor/load').then((res) => {
        if (res && res.data) {
          this.loadData = res.data;
          for (let hostname in this.loadData) {
            let arrLength = this.loadData[hostname].length;
            let latestLoadForHost = this.loadData[hostname][arrLength - 1];
            this.load.cpuPercent = parseFloat(latestLoadForHost.cpu_percent.toFixed(2));
            this.load.gpuPercent = parseFloat(latestLoadForHost.gpu_percent[0].toFixed(2));
            this.load.memoryPercent = parseFloat(latestLoadForHost.memory_percent.toFixed(2));
            if (this.computeLoadProgressStatus(this.load.cpuPercent) != "success") {
              this.$notify({
                title: '硬件资源警告',
                message: '服务器：<br>' + hostname + '<br>CPU负载过高',
                dangerouslyUseHTMLString: true,
                type: 'warning'
              });
            }
            if (this.computeLoadProgressStatus(this.load.gpuPercent) != "success") {
              this.$notify({
                title: '硬件资源警告',
                message: '服务器：<br>' + hostname + '<br>GPU负载过高',
                dangerouslyUseHTMLString: true,
                type: 'warning'
              });
            }
            if (this.computeLoadProgressStatus(this.load.memoryPercent) != "success") {
              this.$notify({
                title: '硬件资源警告',
                message: '服务器：<br>' + hostname + '<br>内存负载过高',
                dangerouslyUseHTMLString: true,
                type: 'warning'
              });
            }
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