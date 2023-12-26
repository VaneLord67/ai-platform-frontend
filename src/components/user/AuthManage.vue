<template>
  <navigation>
    <el-tabs type="card">
      <el-tab-pane label="用户管理">
        <user-manage></user-manage>
      </el-tab-pane>
      <el-tab-pane label="角色管理">
        <role-manage></role-manage>
      </el-tab-pane>
    </el-tabs>
  </navigation>
</template>

<script>
import Navigation from '../common/Navigation.vue';
import UserManage from './UserManage.vue';
import RoleManage from './RoleManage.vue';
export default {
  name: 'AuthManage',
  components: {
    Navigation, UserManage, RoleManage
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