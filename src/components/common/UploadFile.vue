<template>
  <div>
    <el-upload class="upload-demo" :multiple="true" ref="upload" action="#" :http-request="handleFileUpload"
      :on-preview="handlePreview" :auto-upload="false" :on-remove="handleRemove" :file-list="fileList"
      list-type="picture">
      <el-button size="small" type="primary">选择图片</el-button>
      <div slot="tip" class="el-upload__tip">可上传jpg图片 / h264编码的mp4视频，文件名不包含中文</div>
    </el-upload>
    <el-button size="small" type="success" @click="uploadButtonClick()">上传到服务器</el-button>

    <div v-for="(url, filename) in fileUrls" :key="filename">
      <!-- 在div中展示键和值 -->
      <p>文件名: {{ filename }}</p>
      <p>URL: {{ url }}</p>
      <el-button type="primary" @click="copy(url)">复制</el-button>
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      fileList: [],
      fileUrls: {},
    };
  },
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleFileUpload(file) {
      this.fileUrls = {};
      // console.log(file);
      let get_presigned_url_param = {
        objectName: file.file.name
      }
      // console.log("param: " + get_presigned_url_param.objectName)
      this.$axios.get("/object_storage/presigned_url", {
        params: get_presigned_url_param,
      }).then((res) => {
        let presigned_url = res.data;
        this.$axios.put(presigned_url, file.file, {
          headers: {
            'Content-Type': 'application/octet-stream',
          }
        }).then(() => {
          this.$message({
            type: "success",
            message: "上传成功!",
          });
          let get_url_param = {
            objectName: file.file.name
          }
          this.$axios.get('/object_storage/url', {
            params: get_url_param,
          }).then((res) => {
            if (res && res.data) {
              // this.fileUrls[file.file.name] = res.data;
              this.$set(this.fileUrls, file.file.name, res.data);
              // console.log(this.fileUrls);
            }
          });
        });
      });
    },
    uploadButtonClick() {
      this.$refs.upload.submit();
    },
    copy(url) {
      // 创建一个input框
      const input = document.createElement('input')
      // 将指定的DOM节点添加到body的末尾
      document.body.appendChild(input)
      // 设置input框的value值为复制的值
      const address = url
      input.setAttribute('value', address)
      // 选取文本域中的内容
      input.select()
      // copy的意思是拷贝当前选中内容到剪贴板
      // document.execCommand（）方法操纵可编辑内容区域的元素
      // 返回值为一个Boolean，如果是 false 则表示操作不被支持或未被启用
      if (document.execCommand('copy')) {
        document.execCommand('copy')
      }
      // 删除这个节点
      document.body.removeChild(input)
      // 弹窗：复制成功
      this.$message({
        type: "success",
        message: "复制成功!",
      });
    },
  },
}
</script>

<style></style>