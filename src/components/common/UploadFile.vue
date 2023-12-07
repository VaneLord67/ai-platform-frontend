<template>
    <div>
        <el-upload class="upload-demo" :multiple="true" ref="upload" action="#" :http-request="handleFileUpload" :on-preview="handlePreview" :auto-upload="false"
            :on-remove="handleRemove" :file-list="fileList" list-type="picture">
            <el-button size="small" type="primary">选择图片</el-button>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
        <el-button size="small" type="success" @click="uploadButtonClick()">上传到服务器</el-button>
    </div>
</template>

<script>
export default {
    data() {
      return {
        fileList: [],
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
        console.log(file);
        let get_presigned_url_param = {
            objectName: file.file.name
        }
        console.log("param: " + get_presigned_url_param.objectName)
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
            });
        });
      },
      uploadButtonClick() {
        this.$refs.upload.submit();
      },
    },
}
</script>

<style></style>