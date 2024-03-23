<template>
  <navigation>
    <div v-loading="load.loading" element-loading-text="数据加载中">
      <el-select v-model="selectHostname" placeholder="请选择要查看的服务器" @change="updateChartWithHostname(selectHostname)">
        <el-option
          v-for="hostname in hostnames"
          :key="hostname"
          :value="hostname">
        </el-option>
      </el-select>
      <div id="cpu-chart" 
        style="width: 100%; height: 400px;">
      </div>
      <div id="gpu-chart" 
        style="width: 100%; height: 400px;">
      </div>
      <div id="memory-chart" 
        style="width: 100%; height: 400px;">
      </div>
    </div>
  </navigation>
</template>

<script>
import Navigation from "../common/Navigation.vue";
import * as echarts from 'echarts';
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
      selectHostname: "",
      hostnames: [],
      cpuChart: null,
      gpuChart: null,
      memoryChart: null,
      load: {
        cpuPercent: 0,
        memoryPercent: 0,
        gpuPercent: 0,
        loading: true,
      },
      loadData: null,
      timer: null,
    };
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
    getLoadData() {
      if (this.selectHostname === '') {
        this.load.loading = true;
      }
      this.$axios.get('/monitor/load').then((res) => {
        if (res && res.data) {
          this.loadData = res.data;
          this.hostnames = Object.keys(this.loadData);
          if (Object.keys(this.loadData).length > 0) {
            if (this.selectHostname === '' || (!(this.selectHostname in this.loadData))) {
              this.selectHostname = Object.keys(this.loadData)[0];
            }
            this.updateChartWithHostname(this.selectHostname);
          }
        }
      }).finally(() => {
        this.load.loading = false;
      });
      setTimeout(() => {
        this.getLoadData();
      }, 5000);
    },
    initChart() {
      this.cpuChart = echarts.init(document.getElementById('cpu-chart'));
      this.gpuChart = echarts.init(document.getElementById('gpu-chart'));
      this.memoryChart = echarts.init(document.getElementById('memory-chart'));
      this.getLoadData();
    },
    updateChartWithHostname(hostname) {
      let xAxisData = [];
      let cpuSeriesData = [];
      let gpuSeriesData = [];
      let memorySeriesData = [];
      let loadDataForHost = this.loadData[hostname]
      loadDataForHost.forEach(e => {
        xAxisData.push(new Date(e.time * 1000));
        cpuSeriesData.push(e.cpu_percent);
        gpuSeriesData.push(e.gpu_percent.length > 0 ? e.gpu_percent[0] * 100 : 0);
        memorySeriesData.push(e.memory_percent);
      });
      const commonTooltip = {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: '#fff', // 悬浮框背景色
        borderColor: '#000', // 悬浮框边框颜色
        borderWidth: 1, // 悬浮框边框宽度
        textStyle: { // 悬浮框文字样式
          color: '#000',
          fontSize: 12
        }
      };
      const commonXAxis = {
        type: 'category',
        data: xAxisData,
        name: '时间',
      }
      const cpuOption = {
        tooltip: commonTooltip,
        xAxis: commonXAxis,
        yAxis: {
          type: 'value',
          name: 'CPU利用率',
        },
        series: [
          {
            data: cpuSeriesData,
            type: 'line',
            smooth: true
          }
        ]
      };
      const gpuOption = {
        tooltip: commonTooltip,
        xAxis: commonXAxis,
        yAxis: {
          type: 'value',
          name: 'GPU利用率',
        },
        series: [
          {
            data: gpuSeriesData,
            type: 'line',
            smooth: true
          }
        ]
      };
      const memoryOption = {
        tooltip: commonTooltip,
        xAxis: commonXAxis,
        yAxis: {
          type: 'value',
          name: '内存利用率',
        },
        series: [
          {
            data: memorySeriesData,
            type: 'line',
            smooth: true
          }
        ]
      };
      this.cpuChart.setOption(cpuOption);
      this.gpuChart.setOption(gpuOption);
      this.memoryChart.setOption(memoryOption);
    },
  },

  mounted() {
    this.initChart();
  },
}
</script>

<style>

</style>