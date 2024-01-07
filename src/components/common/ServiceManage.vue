<template>
  <div v-loading="loading">
    <div style="font-weight: bold; padding-bottom: 20px;">
      服务信息
    </div>
    <el-descriptions v-show="showServiceInfo">
        <el-descriptions-item label="适用领域">{{ modelField }}</el-descriptions-item>
        <el-descriptions-item label="模型名">{{ modelName }}</el-descriptions-item>
    </el-descriptions>
  
    <el-descriptions>
      <el-descriptions-item label="正在运行的实例数">{{ runningInstanceCount }}</el-descriptions-item>
      <el-descriptions-item label="可运行的实例数">{{ readyInstanceCount }}</el-descriptions-item>
    </el-descriptions>

    <div v-for="(service, index) in this.blockedServices" :key="index">
      <i class="el-icon-warning"></i>
      机器：{{ service.hostname }} 任务阻塞, 任务类型: {{ service.task_type }}, 任务开始时间: {{ service.task_start_time_string }}
    </div>

    <br>
  
    <el-button type="success" round size="small" @click="start()">启动一个实例</el-button>
    <el-button type="danger" round size="small" @click="stop()">停止一个实例</el-button>
    <el-button type="danger" round size="small" @click="stopAll()">一键停止所有实例</el-button>
  </div>
</template>

<script>
export default {
  name: 'ServiceManage',
  props: ['serviceName'],
  data() {
    return {
      modelName: "",
      modelField: "",
      services: [],
      blockedServices: [],
      loading: true,
    }
  },
  computed: {
    showServiceInfo: function() {
      if (this.services.length == 0) {
        return false;
      }
      return true;
    },
    runningInstanceCount: function () {
      let count = 0;
      for (const service of this.services) {
        if (service.state == "running") {
          count++;
        }
      }
      return count;
    },
    readyInstanceCount: function () {
      let count = 0;
      for (const service of this.services) {
        if (service.state == "ready") {
          count++;
        }
      }
      return count;
    },
  },
  methods: {
    getServiceList() {
      this.loading = true;
      let param = {
        "serviceName": this.serviceName,
      };
      this.$axios.get("/model/manage/service/list", {params: param}).then((res) => {
        this.services = res.data;
        this.blockedServices = this.services.filter(service => {
          let task_start_time = service.task_start_time;
          let current_time = new Date().getTime();
          // 计算给定时间戳与当前时间戳的差值（单位：毫秒）
          let timeDifference = current_time - task_start_time;
          // 将毫秒转换为小时
          let hoursDifference = timeDifference / (1000 * 60 * 60); // 1000毫秒 * 60秒 * 60分
          // 检查差值是否大于阈值
          return hoursDifference > 1 && service.state != 'ready' && service.task_type != 'camera';
        }).map(service => {
          let date = new Date(service.task_start_time);
          return {
            ...service,
            'task_start_time_string': date.toLocaleString(),
          }
        });
        this.$emit('services-event', this.services);
        if (this.services.length == 0) {
          this.$emit('call-disabled-event', true);
        }
        if (this.services.length > 0) {
          let hyperparameters = this.services[0].model.hyperparameters;
          hyperparameters.map(e => {
            e.value = e.default;
            return e;
          });
          this.modelName = this.services[0].model.name;
          this.modelField = this.services[0].model.field;

          this.$emit('hyperparameter-event', this.services[0].model.hyperparameters);
          this.$emit('call-disabled-event', false);
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    stopAll() {
      let dto = {
        serviceName: this.serviceName,
      };
      this.$axios.post(`/model/manage/service/stop_all`, dto).then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getServiceList();
        }, 5000);
      });
    },
    stop() {
      let dto = {
        serviceName: this.serviceName,
      };
      this.$axios.post("/model/manage/service/stop", dto).then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getServiceList();
        }, 5000);
      });
    },
    start() {
      let dto = {
        serviceName: this.serviceName,
      };
      this.$axios.post(`/model/manage/service/start`, dto).then((res) => {
        if (res && res.code == 1) {
          this.$message({
            type: "success",
            message: "执行成功!",
          });
        } else {
          this.$message({
            type: "warning",
            message: "执行失败!",
          });
        }
        setTimeout(() => {
          this.getServiceList();
        }, 5000);
      })
    },
  },

  mounted() {
    this.getServiceList();
  },
}
</script>

<style>

</style>