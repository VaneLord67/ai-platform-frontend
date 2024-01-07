<template>
  <el-dialog title="视频处理进度" :visible.sync="visible">
    <div v-show="progress === 100">
      正在进行结果上传，请稍后...
    </div>
    <el-progress style="margin-top: 10px;" :text-inside="true" :stroke-width="26" :percentage="progress"></el-progress>
  </el-dialog>
</template>

<script>
export default {
  name: 'VideoProgress',
  props: {
    progress: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      visible: false,
    }
  },
  methods: {
    dialogClose() {
      this.visible = false;
    },
    dialogOpen() {
      this.visible = true;
    }
  },
}
</script>

<style>

</style>