---
title: 使用Github Actions构建Docker并推送镜像
date: 2023-07-10 15:43:46
updated: 2023-07-10 21:58:55
categories:
	- 技术手册
tags: 
	- Github
	- SpringBoot
	- Docker
---
# 使用Github Actions构建Docker并推送镜像

# Github Actions

GitHub Actions 是一个持续集成和持续交付 (CI/CD) 平台，可让您自动化构建、测试和部署管道，直接从 GitHub 部署代码。您可以创建工作流来构建和测试存储库的每个拉取请求，或将合并的拉取请求部署到生产环境。

GitHub Actions 不仅限于 DevOps，还允许您在存储库中发生其他事件时运行工作流。轻松实现所有软件工作流程的自动化。

Actions ：登录远程服务器，发布内容到第三方服务、抓取代码、运行测试。

## workflow

工作流程：持续集成一次运行的过程，就是一个 workflow。

### Job
    任务：一个 workflow 由一个或多个 jobs 构成，含义是一次持续集成的运行，可以完成多个任务

### Step
    步骤：每个 job 由多个 step 构成，一步步完成

### Actions
    动作：每个 step 可以依次执行一个或多个命令（action）
    
> 参考文档：[Workflow syntax for GitHub Actions - GitHub Docs](https://docs.github.com/cn/actions/using-workflows/workflow-syntax-for-github-actions "Workflow syntax for GitHub Actions - GitHub Docs")

# 详细流程

>以我的SpringBoot练手项目个人Pixiv镜像站 `MyPix` 为例。

## Step1 编写Dockerfile

因为是要构建镜像，所以要先通过Dcokerfile描述下构建流程，由于是SpringBoot项目，所以直接将即将构建好的jar包移进容器再运行jar包即可。

Dockerfile
```dockerfile
# Docker image for springboot file run
# VERSION 0.0.1
# Author: 
# 基础镜像使用java
FROM openjdk:8
# 作者
MAINTAINER leesin
# VOLUME 指定了临时文件目录为/tmp。
# 其效果是在主机 /var/lib/docker 目录下创建了一个临时文件，并链接到容器的/tmp
VOLUME /tmp 
# 将jar包添加到容器中并更名为xx.jar
ADD target/pixiv-0.0.1-SNAPSHOT.jar pix.jar 
# 运行jar包
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/pix.jar"]

```

>直接放在根目录即可

## Step2 编写提交之后的workflow

在项目 **.github/workflows** 文件夹中新建main.yml。编写workflow工作流程。

> 由于是要提交到Docker Hub所以要先去Hub注册账号，将有推送权限的用户名和token存入github仓库的secrets里待下方workflow当变量使用。

以本次为例，大概应该都知道什么意思了
```yaml
on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
env:
  IMAGE_NAME: mypix
jobs:
  build:
    runs-on: ubuntu-latest   
    steps:
      - uses: actions/checkout@v3
      
      #Java环境
      - name: Set up JDK 8
        uses: actions/setup-java@v3
        with:
          java-version: '8'
          distribution: 'zulu'

      - name: Build with Maven
        run: mvn clean package -DskipTests
        
      # 登录Docker Hub
      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.USERNAME }}
          password: ${{ secrets.ACCESS_TOKEN }}
          
      - name: Set up Docker Buildx
        id: buildx
        uses: docker/setup-buildx-action@v1
        
      # build 镜像并push到中央仓库中，下方注意Dockerfile路径
      - name: Build and push
        id: docker_build
        uses: docker/build-push-action@v2
        with:
          context: ./
          file: ./Dockerfile
          push: true
          tags: ${{ secrets.USERNAME }}/mypix:latest
          
	   #可选：保留jar包artifact
      - name: Upload JAR file
        uses: actions/upload-artifact@v2
        with:
          name: Mypix
          path: target/*.jar

```


不出意外的话，每次提交项目到Github的时候会触发Actions运行workflow工作流，将项目打包成jar包，再通过Dockerfile流程将jar包构造成Docker镜像发送至DockerHub保存。

> 由于只是发布镜像，所以至此结束。


# 项目部署

>顺便讲下本项目的部署方法

如果有需要的话仍可直接在上方**SSH连接**个人服务器进行项目部署。
需提前写好启动脚本，然后通过脚本启动，即可实现实时部署。

```yml
	 #push后，用ssh连接服务器执行start.sh脚本    
      - name: SSH
        uses: fifsky/ssh-action@master
        with:
          command: |
            sh start.sh
          host: ${{ secrets.HOST }}
          user: ${{ secrets.USER }}
          key: ${{ secrets.PRIVATE_KEY}}
```

由于需要配置挺多环境参数，所以使用docker-compose部署。

编写docker-compose.yml
```yml
version: '3'
services:
  pixiv:
    image: 'kokutou/mypix:latest'      #pull镜像
    environment:
      - globalcookie=                 #guest，pixiv的cookie
      - mycookie=                     #leesin，pixiv的cookie
      - password=                     #账号名是leesin,密码自设，默认password
      - guestpassword=                #账号名是guest，密码自设，默认password
      - qqnum=xxx                     #做着玩的,随便填充
      - pushurl=xxx                   #做着玩的,随便填充
    ports:
        - '8084:8084'                #本机：容器
    pull_policy: always
    container_name: mypix
```

进入以上yml目录运行docker-compose up -d即可