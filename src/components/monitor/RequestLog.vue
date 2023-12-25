<template>
  <navigation>

    <el-table v-loading="loading" element-loading-text="数据加载中"
      element-loading-spinner="el-icon-loading" :data="tableData" border style="width: 100%">
      <el-table-column label="ID" prop="id"></el-table-column>
      <el-table-column label="用户ID" prop="user_id"></el-table-column>
      <el-table-column label="方法" prop="method"></el-table-column>
      <el-table-column label="路径" prop="path"></el-table-column>
      <el-table-column label="状态码" prop="status_code"></el-table-column>
      <el-table-column label="时间" prop="time" width="150"></el-table-column>
      <el-table-column label="响应时间" prop="duration"></el-table-column>
      <el-table-column label="响应JSON" prop="response_json" width="5000"></el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[5, 10, 20]"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>

  </navigation>
</template>

<script>
import Navigation from "../common/Navigation.vue";
export default {
  name: "RequestLog",
  components: {
    Navigation,
  },

  data() {
    return {
      tableData: [], // 存储来自API响应的数据
      pagination: {
        currentPage: 1,
        pageSize: 5,
        total: 0,
      },
      loading: true,
    };
  },

  methods: {
    getRequestLogs(pageNum, pageSize) {
      let param = {
        pageNum: pageNum,
        pageSize: pageSize,
      }
      this.$axios.get('/monitor/page', {
        params: param
      }).then((res) => {
        this.pagination.total = res.data.total_num;
        this.tableData = res.data.data;
        this.tableData.map(e => {
          let date = new Date(e.time * 1000);
          let dateString = date.toLocaleDateString();
          let timeString = date.toLocaleTimeString();
          let dateTimeString = dateString + ' ' + timeString;
          e.time = dateTimeString;
          return e;
        });
        this.loading = false;
      })
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize);
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize);
    },
  },

  mounted() {
    this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize);
  },
}
</script>

<style>

</style>