<template>
  <navigation>

    <div style="margin-bottom: 20px;">
      <el-row :gutter="80">
        <el-col :span="4">
          开始日期时间：<el-date-picker
            v-model="search.startTime"
            type="datetime"
            placeholder="开始日期时间">
          </el-date-picker>
        </el-col>
        <el-col :span="4">
          结束日期时间：<el-date-picker
            v-model="search.endTime"
            type="datetime"
            placeholder="结束日期时间">
          </el-date-picker>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="4">
          用户名：<el-input v-model="search.username"></el-input>
        </el-col>
        <el-col :span="4">
          服务：<el-input v-model="search.serviceName"></el-input>
        </el-col>
        <el-col :span="4">
          输入模式：<el-input v-model="search.inputMode"></el-input>
        </el-col>
      </el-row>
      <el-button :loading="searchButtonLoading" 
        @click="searchRequestLog" type="primary" style="margin-top: 10px;">
        查询
      </el-button>
    </div>

    <el-table v-loading="loading" element-loading-text="数据加载中"
      element-loading-spinner="el-icon-loading" :data="tableData" border style="width: 100%">
      <!-- <el-table-column label="ID" prop="id"></el-table-column> -->
      <!-- <el-table-column label="用户ID" prop="user_id"></el-table-column> -->
      <el-table-column label="时间" prop="time" width="150"></el-table-column>
      <el-table-column label="用户名" prop="username"></el-table-column>
      <!-- <el-table-column label="方法" prop="method"></el-table-column> -->
      <el-table-column label="服务" prop="serviceName" width="120"></el-table-column>
      <el-table-column label="状态码" prop="status_code"></el-table-column>
      <el-table-column label="输入模式" prop="input_mode"></el-table-column>
      <el-table-column label="响应时间/秒" prop="duration"></el-table-column>
      <el-table-column label="响应" prop="response_json" width="5000"></el-table-column>
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
      searchButtonLoading: false,
      search: {
        username: "",
        serviceName: "",
        startTime: "",
        endTime: "",
        inputMode: "",
      }
    };
  },

  methods: {
    getRequestLogs(pageNum, pageSize, searchDto) {
      this.searchButtonLoading = true;
      let param = {
        pageNum: pageNum,
        pageSize: pageSize,
      }
      if (searchDto) {
        if (searchDto.username) {
          param.username = searchDto.username;
        }
        if (searchDto.serviceName) {
          param.serviceName = searchDto.serviceName;
        }
        if (searchDto.startTime) {
          param.startTime = searchDto.startTime.getTime();
        }
        if (searchDto.endTime) {
          param.endTime = searchDto.endTime.getTime();
        }
        if (searchDto.inputMode) {
          param.inputMode = searchDto.inputMode;
        }
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

          let secondSlashIndex = e.path.indexOf('/', e.path.indexOf('/') + 1);
          if (secondSlashIndex === -1) {
              return e;
          }
          let thirdSlashIndex = e.path.indexOf('/', secondSlashIndex + 1);
          if (thirdSlashIndex === -1) {
              return e;
          }
          e.serviceName = e.path.substring(secondSlashIndex + 1, thirdSlashIndex);
          return e;
        });
      }).finally(() => {
        this.loading = false;
        this.searchButtonLoading = false;
      });
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize, this.search);
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize, this.search);
    },
    searchRequestLog() {
      this.pagination.currentPage = 1;
      this.pagination.pageSize = 5;
      this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize, this.search);
    },
  },

  mounted() {
    this.getRequestLogs(this.pagination.currentPage, this.pagination.pageSize, this.search);
  },
}
</script>

<style>

</style>