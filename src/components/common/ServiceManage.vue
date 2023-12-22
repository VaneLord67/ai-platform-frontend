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