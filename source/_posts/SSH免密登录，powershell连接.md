---
title: SSH免密登录，powershell连接
date: 2024-11-06 09:01:18
updated: 2024-11-06 10:11:29
categories: 
tags: 
---
## SSH免密登录


### 服务端操作

1. 创建密钥
```sh
ssh-keygen -t rsa              #一路回车，正常会在~/.ssh目录下生成id_rsa和id_rsa.pub文件
```
2. 将生成的**id_rsa.pub**写入到authorized_keys，以下命令均在.ssh目录里操作
```sh
touch authorized_keys          #无则创建文件
cat id_rsa.pub >> authorized_keys  #写入
```
3. 将生成在~/.ssh目录里的**id_rsa**文件复制到客户端(控制端)，win建议放至C:\\Users\\{username}\\.ssh\\id_rsa

### 客户端连接（powershell举例）

#### 正常连接命令

```
ssh -i C:\\Users\\{username}\\.ssh\\id_rsa yourname@yourip
```

#### 快捷连接（powershell）

>在能正常连接上的基础

1. 在C:\\Users\\{username}\\.ssh 目录下创建config文件，文件无后缀
2. 写入以下内容
```
Host myserver         #自取，用于ssh连接名
HostName 192.168.11.11 #服务器ip
Port 22 
User root    #登录名
IdentityFile C:\\Users\\{username}\\.ssh\\id_rsa #私钥路径
```
3. 在powershell使用以下命令连接即可
```
ssh myserver            
```

#### 一行连接命令都不想打？

> 将命令写入powershell配置文件快捷启动，单击或快捷键连接
> ![](images/9b4cd3492fdf6eeeb736c9fd14e4cf0d.png)

1. 进入powershell设置界面
 ![](images/b74e1fac7491192739c7acbbbe95949c.png)

2. 左下角添加配置文件
 ![](images/26daa6a25d4587b0a74874031edada6b.png)

3. 填写名称和命令行保存，命令行项填写上方正常连接或者快捷连接的命令皆可。在此处也可以进行powershell终端外观个性化配置。
 ![](images/dd5669956deef9acacdb51f39dc5a4c7.png)


 >保存之后配置信息存在JSON文件【添加新配置文件】按钮下方，后续添加多个配置文件可直接在json文件操作，复制粘贴改guid即可。也可以进行备份备用。
 
 