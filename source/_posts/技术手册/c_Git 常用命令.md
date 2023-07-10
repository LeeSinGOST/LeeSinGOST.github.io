---
title: Git 常用命令
abbrlink: 3223
date: 2023-06-30 14:03:57
updated: 2023-07-01 11:11:35
categories:
tags:
---
# Git 常用命令

> 简单常用

# 初始化仓库
```shell
git init                                  //初始化仓库
git add .                                 //暂存区
git commit -m '初始化提交'                 //本地仓库
git remote add origin "https://xxx.git"   //绑定仓库
git push -u origin "master"               //首次提交到master，后面去掉-u
```

# 配置与状态
```shell
git config --global user.name "用户名"                       //全局用户名
git config --global user.email "example@gmail.com"          //全局邮箱
git config --global --unset user.eamil                      //删除全局配置
git status       //查看状态

```

# 回退版本方法
