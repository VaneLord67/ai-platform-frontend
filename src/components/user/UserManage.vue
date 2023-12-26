<template>
  <div>
    <el-table v-loading="loading" element-loading-text="数据加载中"
      element-loading-spinner="el-icon-loading" :data="tableData" border style="width: 100%">
      <el-table-column label="用户ID" prop="id"></el-table-column>
      <el-table-column label="用户名" prop="username"></el-table-column>
      <el-table-column label="角色" prop="role"></el-table-column>
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <el-button type="text" @click="openDialog(scope.row)">编辑</el-button>
          <el-dialog title="用户表单" :visible.sync="dialogFormVisible">
            <el-form :model="form">
              <el-form-item v-show="false">
                <el-input v-model="form.id" autocomplete="on"></el-input>
              </el-form-item>
              <el-form-item label="用户名" >
                <el-input v-model="form.username" autocomplete="on"></el-input>
              </el-form-item>
              <el-form-item label="角色" >
                <el-input v-model="form.role" autocomplete="on"></el-input>
              </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
              <el-button @click="dialogFormVisible = false">取 消</el-button>
              <el-button type="primary" @click="updateUser">确 定</el-button>
            </div>
          </el-dialog>
        </template>
      </el-table-column>
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

  </div>
</template>

<script>
export default {
  name: "UserManage",
  data() {
    return {
      loading: true,
      pagination: {
        currentPage: 1,
        pageSize: 5,
        total: 0,
      },
      tableData: [],
      form: {
        id: 0,
        username: "",
        role: "",
      },
      dialogFormVisible: false,
    }
  },
  methods: {
    getUserList(pageNum, pageSize) {
      let param = {
        pageNum: pageNum,
        pageSize: pageSize,
      }
      this.$axios.get('/user/page', {
        params: param
      }).then((res) => {
        this.pagination.total = res.data.total_num;
        this.tableData = res.data.data;
      }).finally(() => {
        this.loading = false;
      })
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.getUserList(this.pagination.currentPage, this.pagination.pageSize);
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.getUserList(this.pagination.currentPage, this.pagination.pageSize);
    },
    updateUser() {
      let dto = {
        id: this.form.id,
        username: this.form.username,
        role: this.form.role,
      };
      this.$axios.put('/user', dto).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: 'warning',
            message: '编辑用户失败'
          });
          return;
        }
        this.$message({
          type: 'success',
          message: '编辑用户成功'
        });
        this.getUserList(this.pagination.currentPage, this.pagination.pageSize);
      }).finally(() => {
        this.dialogFormVisible = false;
      })
    },
    openDialog(row) {
      this.dialogFormVisible = true;

      let id = row.id;
      let username = row.username;
      let role = row.role;
      this.form.id = id;
      this.form.username = username;
      this.form.role = role;

    }

  },
  mounted() {
    this.getUserList(this.pagination.currentPage, this.pagination.pageSize);
  },
}
</script>

<style>

</style>