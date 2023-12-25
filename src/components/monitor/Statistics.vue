<template>
  <navigation>
    <div v-loading="loading">
      <el-tabs type="border-card">
        <el-tab-pane label="分类服务">
          <statistic-datum
          :averageResponseTime="statisticsMap.recognition.day.averageResponseTime"
          :errorRate="statisticsMap.recognition.day.errorRate"
          :totalCalls="statisticsMap.recognition.day.totalCalls"
          title="每天流量监控"></statistic-datum>
          <statistic-datum
          :averageResponseTime="statisticsMap.recognition.hour.averageResponseTime"
          :errorRate="statisticsMap.recognition.hour.errorRate"
          :totalCalls="statisticsMap.recognition.hour.totalCalls"
          title="每小时流量监控"></statistic-datum>
        </el-tab-pane>
        <el-tab-pane label="检测服务">
          <statistic-datum
            :averageResponseTime="statisticsMap.detection.day.averageResponseTime"
            :errorRate="statisticsMap.detection.day.errorRate"
            :totalCalls="statisticsMap.detection.day.totalCalls"
            title="每天流量监控"
          ></statistic-datum>
          <statistic-datum
            :averageResponseTime="statisticsMap.detection.hour.averageResponseTime"
            :errorRate="statisticsMap.detection.hour.errorRate"
            :totalCalls="statisticsMap.detection.hour.totalCalls"
            title="每小时流量监控"
          ></statistic-datum>
        </el-tab-pane>
        <el-tab-pane label="跟踪服务">
          <statistic-datum
            :averageResponseTime="statisticsMap.track.day.averageResponseTime"
            :errorRate="statisticsMap.track.day.errorRate"
            :totalCalls="statisticsMap.track.day.totalCalls"
            title="每天流量监控"
          ></statistic-datum>
          <statistic-datum
            :averageResponseTime="statisticsMap.track.hour.averageResponseTime"
            :errorRate="statisticsMap.track.hour.errorRate"
            :totalCalls="statisticsMap.track.hour.totalCalls"
            title="每小时流量监控"
          ></statistic-datum>
        </el-tab-pane>
      </el-tabs>
    </div>
  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue';
import StatisticDatum from '../monitor/StatisticDatum.vue';
export default {
  components: { 
    StatisticDatum,
    Navigation, 
  },
  name: "Statistics",
  data() {
    return {
      loading: true,
      statisticsMap: {
        recognition: {
          day: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
        detection: {
          day: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
        track: {
          day: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
          hour: {
            averageResponseTime: 0,
            errorRate: 0,
            totalCalls: 0,
          },
        },
      },
    }
  },
  methods: {
    convert(e) {
      return {
        averageResponseTime: e.average_response_time,
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

        // console.log(this.statisticsMap);

      }).finally(() => {
        this.loading = false;
      });
    },
  },
  mounted() {
    this.getStatisticsData();
  },
}
</script>

<style>

</style>