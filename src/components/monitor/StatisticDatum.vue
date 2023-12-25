<template>
  <div>
    <h1>{{ title }}</h1>
    <el-row :gutter="20">
      <el-col :span="6">
        <div>
          <el-statistic
            :value="totalCalls"
            title="请求量（次）"
          ></el-statistic>
        </div>
      </el-col>
      <el-col :span="6">
        <div>
          <el-statistic
            :precision="2"
            :value="averageResponseTime"
            title="平均响应时间（秒）"
          ></el-statistic>
        </div>
      </el-col>
      <el-col :span="6">
        <div>
          <el-statistic
            :precision="2"
            :value="errorRate"
            title="错误率（%）"
          ></el-statistic>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "StatisticDatum",
  props: {
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    errorRate: {
      type: Number,
      default: 0,
    },
    totalCalls: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      default: "",
    }
  },
  data() {
    return {
      
    }
  },
  methods: {
    
  },
}
</script>

<style>

</style>