<template>
  <navigation>
    <div v-loading="loading">
      <el-tabs type="border-card" @tab-click="handleTabClick">
        <el-tab-pane v-for="(statisticData, serviceName) in statisticsMap" :label="serviceName" :key="serviceName">
          <statistic-datum
            v-for="(data, timePeriod) in statisticData"
            :key="timePeriod"
            :averageResponseTime="data.averageResponseTime"
            :maxResponseTime="data.maxResponseTime"
            :errorRate="data.errorRate"
            :totalCalls="data.totalCalls"
            :title="getTitle(timePeriod)"
          ></statistic-datum>
        </el-tab-pane>
      </el-tabs>
    </div>
    <h3>时间-流量 折线图</h3>
    <el-date-picker
      v-model="search.startTime"
      type="datetime"
      placeholder="开始日期时间">
    </el-date-picker>
    <el-date-picker
      v-model="search.endTime"
      type="datetime" style="margin-left: 10px;"
      placeholder="结束日期时间">
    </el-date-picker>
    <el-button :loading="searchButtonLoading" 
      @click="getChartData" type="primary" style="margin-left: 10px;">
      查询
    </el-button>
    <div id="chart"
      style="width: 100%; height: 400px;">
    </div>
  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue';
import StatisticDatum from '../monitor/StatisticDatum.vue';
import * as echarts from 'echarts';
export default {
  components: { 
    StatisticDatum,
    Navigation, 
  },
  name: "Statistics",
  data() {
    return {
      searchButtonLoading: false,
      chart: null,
      chartData: [],
      search: {
        startTime: "",
        endTime: "",
      },
      loading: true,
      selectServiceName: "",
      statisticsMap: {
        recognition: {
          day: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
        detection: {
          day: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
        track: {
          day: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
      },
    }
  },
  methods: {
    getChartData() {
      let param = {}
      if (this.search.startTime) {
        param.startTime = this.search.startTime.getTime();
      }
      if (this.search.endTime) {
        param.endTime = this.search.endTime.getTime();
      }
      this.$axios.get('/monitor/chart', {
        params: param
      }).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: "warning",
            message: "获取图表数据失败",
          });
          return;
        }
        this.chartData = res.data;
        if (this.chartData.length == 0) {
          this.$message({
            type: "warning",
            message: "在此时间段无数据",
          });
          this.chart.clear();
          return;
        }
        const initServiceName = Object.keys(this.statisticsMap)[0];
        this.selectServiceName = this.selectServiceName || initServiceName;
        this.updateChartWithServiceName(this.selectServiceName);
      });
    },
    handleTabClick(tabElement) {
      const serviceName = tabElement.label;
      this.selectServiceName = serviceName;
      this.updateChartWithServiceName(this.selectServiceName);
    },
    getTitle(timePeriod) {
      if (timePeriod === 'day') {
        return "每天流量监控";
      } else if (timePeriod === 'hour') {
        return "每小时流量监控";
      }
      return "";
    },
    convert(e) {
      return {
        averageResponseTime: e.average_response_time,
        maxResponseTime: e.max_response_time,
        errorRate: e.errorRate,
        path: e.path,
        totalCalls: e.total_calls,
      };
    },
    getStatisticsData() {
      this.$axios.get('/monitor/statistics').then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: "warning",
            message: "获取统计数据失败",
          });
          return;
        }
        // console.log(res);
        let statisticsForDay = res.data.statistics_for_day;
        let statisticsForHour = res.data.statistics_for_hour;

        statisticsForDay.forEach(e => {
          if (e.path == '/model/track/call') {
            // this.$set(this.statisticsMap.track, 'day', e);
            // this.statisticsMap.track.day.averageResponseTime = e.
            this.statisticsMap.track.day = this.convert(e);
          } else if (e.path == '/model/detection/call') {
            this.statisticsMap.detection.day = this.convert(e);
          } else if (e.path == '/model/recognition/call') {
            this.statisticsMap.recognition.day = this.convert(e);
          }
        });

        statisticsForHour.forEach(e => {
          if (e.path == '/model/track/call') {
            this.statisticsMap.track.hour = this.convert(e);
          } else if (e.path == '/model/detection/call') {
            this.statisticsMap.detection.hour = this.convert(e);
          } else if (e.path == '/model/recognition/call') {
            this.statisticsMap.recognition.hour = this.convert(e);
          }
        });
        this.initChart();
      }).finally(() => {
        this.loading = false;
      });
    },
    updateChartWithServiceName(serviceName) {
      let xAxisData = [];
      let seriesData = [];
      this.chartData.forEach(e => {
        if (e.service_name === serviceName) {
          xAxisData.push(e.hour_interval);
          seriesData.push(e.record_count);
        }
      });
      const option = {
        tooltip: {
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
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          name: '时间',
        },
        yAxis: {
          type: 'value',
          name: '请求量/次',
        },
        series: [
          {
            data: seriesData,
            type: 'line',
            smooth: true
          }
        ]
      };
      this.chart.setOption(option, true);
    },
    initChart() {
      this.chart = echarts.init(document.getElementById('chart'));
      this.getChartData();
    },
  },
  mounted() {
    this.getStatisticsData();
  },
}
</script>

<style>

</style>