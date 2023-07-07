---
title: frp使用教程，实现无公网稳定远程桌面
date: 2023-07-06 19:47:11
updated: 2023-07-07 21:13:36
cover: 'https://fastly.jsdelivr.net/gh/LeeSinGOST/Pictory/img/202307071755649.png'
categories:
	- 使用教程
tags: 
---
# frp使用教程，实现无公网稳定远程桌面

>通过配置端口映射让处于无公网环境下的电脑随时随地通过服务器反向代理被控制端。
>[frp官方文档 | frp (gofrp.org)](https://gofrp.org/docs/overview/)
>frp配合微软官方远程桌面使用还是挺稳定的，对服务器带宽也没有要求，配置好之后，电脑开机即服务自启，至于暴露之后的安全 #问题 目前还没评估。

# 前置条件

- 公网服务器，配置不限。这里以Ubuntu系统为例
- 被控制端电脑
- 控制端（安卓手机建议使用微软官方远程桌面软件

# 整体步骤

1. 在服务器配置好frps服务，即配置文件frps.ini，包括服务器所监听端口、连接密钥
2. 在被控制端电脑配置好frpc服务，即配置文件frps.ini，配置需要映射本地端口，目标映射端口，网络类型
3. 先通过 `./frps -c ./frps.ini` 启动服务端，再通过 `./frpc -c ./frpc.ini` 启动客户端。如果需要在后台长期运行，建议结合其他工具使用，例如 [systemd](https://gofrp.org/docs/setup/systemd/) 和 `supervisor`。
4. 在控制端通过服务器ip和配置的端口访问被控制端。

# 详细步骤

## Step 1 配置服务端

目前可以在 Github 的 [Release](https://github.com/fatedier/frp/releases) 页面中下载到最新版本的客户端和服务端二进制文件，所有文件被打包在一个压缩包中。解压到任意目录，打开frps.ini编辑。
```ini
[common]
bind_port = 7000   //服务监听端口，必填

//可选
auto_token = tokenn  //密钥，建议加上
vhost_http_port = 8000 //http代理，type=http绑定域名可用，此处不需要

//可选配置web ui界面
dashboard_port = 7500   //web端口
dashboard_user = admin  //管理登录用户名
dashboard_pwd = admin   //登录密码
```

## Step 2 配置客户端

同在 Github 的 [Release](https://github.com/fatedier/frp/releases) 页面中下载到最新版本的客户端和服务端二进制文件，所有文件被打包在一个压缩包中。
```shell
tar -zxvf frp_xxx.tar.gz
```

解压到任意目录，打开frpc.ini编辑。

```ini
[common]
server_addr = x.x.x.x    //对接服务器公网ip
server_port = 7000       //服务器配置里的监听端口
    
[rdp]                      //随便
type = tcp
local_ip = 127.0.0.1
local_port = 3389         //需要暴露的本地端口，3389为windows远程桌面默认端口
remote_port = 3389        
//服务器映射目标端口，可自定义，访问此端口的流量将会被转发到本地服务对应的端口。
```

## Step 3 服务端和客户端，启动！


通过 `./frps -c ./frps.ini` 启动服务端，
再通过 `./frpc -c ./frpc.ini` 启动客户端。
如果需要在后台长期运行，建议结合其他工具使用，例如 [systemd](https://gofrp.org/docs/setup/systemd/) 和 `supervisor`。

在 Linux 系统下，使用`systemd` 可以方便地控制 frp 服务端 `frps` 的启动和停止、配置后台运行和开启自启。

要使用 `systemd` 来控制 `frps`，需要先安装 `systemd`，然后在 `/etc/systemd/system` 目录下创建一个 frps.service 文件。

### 关于后台自启
1. 如Linux服务端上没有安装 `systemd`，可以使用 `yum` 或 `apt` 等命令安装 `systemd`。
    
    ```bash
    # yum
    yum install systemd
    # apt
    apt install systemd
    ```
    
2. 使用文本编辑器，如 `vim` 创建并编辑 `frps.service` 文件。
    
    ```bash
    $ vim /etc/systemd/system/frps.service
    ```
    
写入内容
    
```ini
[Unit]
# 服务名称，可自定义
Description = frp server
After = network.target syslog.target
Wants = network.target

[Service]
Type = simple
# 启动frps的命令，需修改为您的frps的安装路径
ExecStart = /path/to/frps -c /path/to/frps.ini

[Install]
WantedBy = multi-user.target 
```

3. 使用 `systemd` 命令，管理 frps。
    
```bash
# 启动frp
systemctl start frps
# 停止frp
systemctl stop frps
# 重启frp
systemctl restart frps
# 查看frp状态
systemctl status frps
```
    
4. 配置 frps 开机自启。
    
```bash
systemctl enable frps
```



## Step 4 连接start

在远程桌面软件输入主机号即可


# 注意事项

云服务器要**打开端口**，包括监听端口以及客户端所绑定的目标端口。


