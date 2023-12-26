<template>
  <div>
    <el-select v-model="select" placeholder="请选择角色" @change="getRolePermissions">
      <el-option
        v-for="item in allRoles"
        :key="item"
        :label="item"
        :value="item"
      >
      </el-option>
    </el-select>

    <el-transfer style="margin-top: 30px;"
      v-model="transferKeys"
      :props="{
        key: 'description',
        label: 'description'
      }"
      :titles="['所有权限列表', '角色权限列表']"
      :data="allPermissions">
    </el-transfer>

    <el-button style="margin-top: 30px;" type="success" @click="updateRolePermission">提交</el-button>

  </div>
</template>

<script>
export default {
  name: 'RoleManage',
  data() {
    return {
      allPermissions: [],
      allPermissionsMap: {},
      allRoles: [],
      loading: true,
      select: "",
      transferKeys: [],
    }
  },
  methods: {
    getAllPermissions() {
      this.$axios.get("/user/permission").then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: 'warning',
            message: '获取权限列表失败',
          });
          return;
        }
        this.allPermissions = res.data;
        this.allPermissions.forEach((permission, index) => {
          this.allPermissionsMap[permission.description] = index;
        })
      });
    },
    getAllRoles() {
      this.$axios.get("/user/role").then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: 'warning',
            message: '获取角色列表失败',
          });
          return;
        }
        this.allRoles = res.data;
      })
    },
    getRolePermissions() {
      this.transferKeys = [];
      this.$axios.get("/user/permission/role", {
        params: {
          role: this.select,
        }
      }).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: 'warning',
            message: '获取角色允许的权限列表失败',
          });
          return;
        }
        // console.log("map:", this.allPermissionsMap);
        let rolePermissions = res.data;
        for (const rolePermission of rolePermissions) {
          if (rolePermission.description in this.allPermissionsMap) {
            this.transferKeys.push(rolePermission.description);
          }
        }
        // console.log("transferKeys:", this.transferKeys);
      });
    },
    updateRolePermission() {
      let permissions = [];
      for (const description of this.transferKeys) {
        if (description in this.allPermissionsMap) {
          let index = this.allPermissionsMap[description];
          let permission = this.allPermissions[index];
          permissions.push(permission);
        }
      }
      let dto = {
        role: this.select,
        permissions: permissions,
      };
      this.$axios.put("/user/permission/role", dto).then((res) => {
        if (!res || (res && res.code != 1)) {
          this.$message({
            type: 'warning',
            message: '提交失败',
          });
          return;
        }
        this.$message({
          type: 'success',
          message: '提交成功',
        });
      });
    },
  },
  mounted() {
    this.getAllRoles();
    this.getAllPermissions();
  },
}
</script>

<style>

</style>