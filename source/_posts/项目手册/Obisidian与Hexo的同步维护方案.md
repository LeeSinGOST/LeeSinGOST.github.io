---
title: OBSidian与HEXO的同步维护方案
categories:
  - 技术手册
tags:
  - HEXO
  - Obisidian
abbrlink: 24083
date: 2023-06-26 11:37:27
updated: 2023-06-27 20:18:39
---

> Obisidian是一个本地笔记软件，可用于构建自己的知识体系，以下简称Ob。Hexo是使用很广泛的博客框架，属于静态页面。本文将记录如何实现Ob在本地写文档，然后一键发送并自动部署到Hexo。

# 实现思路

在Ob上Git提交Hexo项目到自己GitHub Page仓库的一个(Hexo)分支中，GitHub随即自动触发Actions将编译好的Hexo静态文件提交到以上仓库的主分支，也就是说Hexo分支保存项目，主分支保存Page页面访问所需要的静态文件。

# 所需条件

- Hexo 和 Obsidian 的安装
- Git 和 GitHub 的准备
- Obsidian Git （Obisidian插件市场）

# 详细步骤

## Step 1 - Hexo安装

> 已经搭建好Hexo的可以跳过这一步！

Hexo的安装网上教程很多而且文档也很详细了，主要涉及**Git安装和NPM安装**。之后基本就是一键安装，可参考教程 ： [Hexo框架建站教程（一）：前期准备和本地预览](https://zhuanlan.zhihu.com/p/444089468)

如果能成功实现Hexo本地预览即可进入下一步。

## Step 2 - Git初始化配置

配置Git以及设置与GitHub的SSH连接具体操作参考教程里部署到GitHub处 ：[2022【保姆级教程】含泪搭建hexo博客](https://zhuanlan.zhihu.com/p/552639819)
教程包括：

- Git 配置 用户名和邮箱
- 生成SSH密钥并将密钥存入GitHub
- 创建仓库
- 配置好Hexo根目录的 _comfig.yml文件
- 运行下方hexo命令完成部署

 ```shell
hexo clean  # 清除缓存
hexo g      # 生成静态网页
hexo d      # 部署到Github
```

> 我自己是直接部署到GitHub Page的，如果是部署到其他静态托管平台也行，这里主要是Git环境配置并且与GitHub的连接。

成功部署到GitHub Page之后进入下一步。

## Step 3 - 仓库双分支配置

在Hexo根目录输入
```shell
git init                                                #初始化git
git remote add origin `github仓库链接 github.io.git结尾` #建立连接
git add .                                               #至暂存区
git commit -m "说几句"                                   #添加至本地仓库
git push -u origin master                               #推送至远程的master分支

git checkout -b hexo             #该命令相当于 git branch hexo 以及 git checkout hexo，前者是创建分支 hexo，后者是切换到 hexo分支。

git push origin HEAD -u
```

推送后会发现仓库中有两个分支，一个为默认的`master`分支，另一个新建的`hexo`分支，且由于之前命令为`git add .` ，即把根目录中所有文件提交到暂缓区中，故而最终 `push`的文件是根目录中所有未被`git`忽视的文件。（之后自动化任务中的`git push --force --quiet "https://$GH_TOKEN@$REPO" master:master`能让生成的文件覆盖`master`分支中的文件，这样`master`分支中便是我们需要的`public`内的文件了）

此处参考[Hexo 通过 Github Actions 实现持续集成](https://zhuanlan.zhihu.com/p/137867759)，多数操作基于此。

GitHub如期生成Hexo分支并存在项目即可进入下一步

## Step 4 - Obisidian 以及 Obisidian Git插件

> 看这个教程的应该都是Obsidian用户，软件安装就不说了，也没什么好讲，装就是了。
> Git插件主要用于将文档上传到GitHub。

主要讲Obs的配置
1. 使用Obs打开Hexo的根目录
2. 修改笔记创建目录至source里的_post
3. 修改附件目录至source里，可自行创建目录，在source里就行
4. 忽略多余文件，打开 设置>文件与链接>Exclude Files，只保留source，其余忽略。
5. 同上步位置，取消勾选wiki链接，勾选始终更新链接，内部链接类型使用相对路径。
6. 安装Obsidian Git插件, 大概就是关闭安全模式进入插件市场搜索安装，如有网络问题自行解决。
7. Hexo根目录设置.gitignore
```text
.obsidian/workspace
.DS_Store
Thumbs.db
db.json
*.log
node_modules/
public/
.deploy*/
_multiconfig.yml
```
9. 设置模版，以及Obsidian Git的配置和使用，参考[Obsidian+Git完美维护Hexo博客](https://zhuanlan.zhihu.com/p/554333805)里4-Obsidian Git插件的使用章节，模版参考3.2-快速插入Front-matter模板，位置不限。


![可参考我的](../../images/learn/Pasted%20image%2020230626131934.png)


不出意外的话就能推送了。

## Step 5 - 配置GitHub Actions自动部署

### 前置设置

在GitHub里设置密钥Secrets，包括`GIT_EMAIL`和`ACCESS_TOKEN`, 在下面自动部署配置里需要用到这两个参数，所以要先设置。
`GIT_EMAIL` 可直接设置，在值那里输入自己github邮箱。
`ACCESS_TOKEN` 需要在GitHub创建一个无限期且勾选了repo&workflow的token，然后以同种方式设置到Secrets里。
操作详情参考 [【搭建博客】在GitHub上使用vitepress快速搭建博客](https://juejin.cn/post/7035473521480302629)


### Actions 设置

在根目录下新建 `.github`，在其下面再新建 `workflows`，最后在其下新建任务文件（该任务是关于部署的，于是命名为 `deployment.yml`）就 OK 了。

```yaml
# 文件路径 .github/workflows/deployment.yml
name: Deployment

on:
  push:
    branches: [hexo] # 上面创建的分支 only push events on source branch trigger deployment

jobs:
  hexo-deployment:
    runs-on: ubuntu-latest
    env:
      TZ: Asia/Shanghai

    steps:
    - name: Checkout source
      uses: actions/checkout@v2
      with:
        submodules: true

    - name: Setup Node.js
      uses: actions/setup-node@v1
      with:
        node-version: '12.x'

    - name: Install dependencies & Generate static files
      run: |
        node -v
        npm i -g hexo-cli
        npm i
        hexo clean
        hexo g
    - name: Deploy to Github Pages
      env:
        GIT_NAME:              #设置自己的用户名！！！！！！！！！！！！！！
        GIT_EMAIL: ${{ secrets.GIT_EMAIL }} 
        REPO: xxx.github.io   #设置自己的仓库路径！！！！！！！！！！！！！
        GH_TOKEN: ${{ secrets.ACCESS_TOKEN }}
      run: |
        cd ./public && git init && git add .
        git config --global user.name $GIT_NAME
        git config --global user.email $GIT_EMAIL
        git commit -m "Site deployed by GitHub Actions"
        git push --force --quiet "https://$GH_TOKEN@$REPO" master:master
```

- `branches: [hexo]`：只监听`hexo`分支中的变动
- `npm i -g hexo-cli`：给虚拟机装上`hexo`操作环境
- `npm i`：安装 `package.json` 中所记录的插件
- `hexo g`：通过这种方法生成`public`，若安装了`gulp`相关插件，则可替换为`gulp build`，其它类似。
- `REPO`：仓库地址一定要写对
- `on` 表示触发条件
- `jobs` 表示要做的工作
- `jobs` 下的 step 表示要做的步骤，前一步失败，后面不会继续执行。
- `jobs` 下的 step 下有 name、uses、with 等，表示一个 action。
- `name` 表示 action 的名称，uses 表示使用哪个插件，with 表示传给插件的参数。
- `secrets.XXX` 这个 XXX 表示本仓库的环境变量，配置在仓库设置里面的 secrets 菜单拦，都是加密的。

> 记得在上述配置中修改自己的仓库路径，其他如分支名是源项目库，教程分支名为hexo。此处参考[Hexo 通过 Github Actions 实现持续集成](https://zhuanlan.zhihu.com/p/137867759)

> 提交修改
```shell
git add .
git commit -m "利用 Github Actions 持续集成"
git push origin hexo
```

**在哪个分支下就`push`哪个分支，不要弄混`git push origin hexo`和`git push origin master`**
最后前往仓库的 Actions，即可看到自动化任务正在进行，等待一会即可成功！

若部署失败，请自行进入失败的任务项目，浏览部署日志，查找问题所在！
若部署失败，请自行进入失败的任务项目，浏览部署日志，查找问题所在！

> 若成功，那以后就可以直接在Obsidian插件处git提交了，提交之后自动会触发部署。
 
 ![成功提交](../../images/learn/Pasted%20image%2020230626140650.png)
 ![成功部署](../../images/learn/Pasted%20image%2020230626141125.png)

# 遇到的问题

## 重新部署完GitHub自定义域名丢失

如果有需要使用自己的域名的，每次重新部署完可能会出现404，这是因为创建完自定义域名之后会在项目新增一个CNAME文件，文件里存着域名，如图：
![](../../images/learn/Pasted%20image%2020230626140508.png)
所以只要把CNAME文件放到Hexo根目录的source文件夹即可，这样部署完就会一起发送到静态页面处。
![](../../images/learn/Pasted%20image%2020230626140323.png)

