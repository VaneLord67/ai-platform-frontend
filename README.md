# 面向多AI模型部署管理的微服务平台
基于TensorRT深度学习推理架构和Nameko基础微服务库，设计并实现一个面向多AI模型部署管理的微服务平台。
针对检测、识别、跟踪等典型AI模型部署，封装多输入形式（图像序列和IP地址）的接口服务，
提供服务启停、服务发现、负载均衡、服务多实例等微服务基础功能， 并实现Web管理平台页面，
包括微服务算法参数配置与测试模拟、任务请求/设备状况/流量可视化监控、一键启停控制、任务阻塞预警、硬件资源红线预警、报错前台提示等功能。

# build step
## 安装依赖
```
# 在项目根目录下
pnpm install
```

## 修改ip地址和端口
将src/service.js中的baseURL的ip地址修改为部署flask的机器的ip地址

## 打包
运行下面的命令后，会产生一个dist文件夹，将dist文件夹上传到部署web前端的服务器上，例如/home/ubuntu/ai-platform/dist;
```
pnpm run build
```

## Nginx安装
ubuntu下进行Nginx安装：
```shell
apt install nginx
```

## Nginx配置
修改/etc/nginx/nginx.conf，（如果没有这个文件，google下当前操作系统和nginx版本下的nginx配置文件路径）
其他地方不用变，在http块中删去其他server块，填写如下server块，将root /home/ubuntu/ai-platform/dist改为dist文件夹所处的位置。
```conf

server {
    listen 80;
    server_name localhost;

    location / {
        root /home/ubuntu/ai-platform/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}

```

配置好后保存，运行如下命令：
```shell
# 重新读取配置使刚刚修改的配置生效
nginx -s reload
```

## 访问测试
按照ai-platform-backend中README.md的build step运行起后端后，打开浏览器，访问运行前端服务器的ip地址，测试是否部署成功。如果访问失败，查看80端口和后端flask的8086端口是否被服务器防火墙拦截，或F12打开浏览器调试控制台查看详细报错信息。

