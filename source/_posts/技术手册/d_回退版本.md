---
title: Git 回退版本
categories:
  - 学习
tags:
  - Git
abbrlink: 47779
date: 2023-06-30 22:45:06
updated: 2023-06-30 22:48:58
---

# Git 回退版本

# 方法1 git reset

## 理论
>**原理：** git reset的作用是修改HEAD的位置，即将HEAD指向的位置改变为之前存在的某个版本，如下图所示，假设我们要回退到版本一：

![](images/0d05be8c5cacbecd89b076b361c350f7.png)
>**适用场景：** 如果想恢复到之前某个提交的版本，且那个版本之后提交的版本我们都不要了，就可以用这种方法。

---

## reset四种模式

### mixed
- 移动本地库HEAD指针
- 重置暂存区
- 重置工作区

> 归滚后不要被回滚的代码就选择


### soft
- 移动本地库HEAD指针

> 归滚后要被回滚的代码，被回滚的代码在暂存区，当然也可以在工作区修改被回滚的代码


### hard
- 移动本地库HEAD指针
- 重置暂存区
    
> 归滚后要被回滚的代码，被回滚的代码不在暂存区，当然也可以在工作区修改被回滚的代码


### keep
- 移动本地库HEAD指针
- 暂存区不变
- 重置工作区
    
> 归滚后要被回滚的代码，被回滚的代码在暂存区，因为要重置工作区，所以暂存区和工作区会存在冲突（要解决冲突）

---
## 具体操作（包括查看版本记录）

```shell
git log                  //查看git仓库此时提交记录以及版本号
        --pretty=onel     //精简输出
         
git reset  --`模式` `版本号 shA1`   
//根据版本号回退，即修改HEAD指向，丢失后续版本，而且需要强制提交。

git push -f //配合强制提交

```

---

# 方法2 git revert

## 理论

>**原理**： git revert是用于“反做”某一个版本，以达到撤销该版本的修改的目的。比如，我们commit了三个版本（版本一、版本二、 版本三），突然发现版本二不行（如：有bug），想要撤销版本二，但又不想影响撤销版本三的提交，就可以用 git revert 命令来反做版本二，生成新的版本四，这个版本四里会保留版本三的东西，但撤销了版本二的东西。如下图所示：


![](images/c7dc539355a11c5805d3085ce286497d.png)

 >**适用场景：** 如果我们想撤销之前的某一版本，但是又想保留该目标版本后面的版本，记录下这整个版本变动流程，就可以用这种方法。

---

## 具体操作

```shell
git log                  //查看git仓库此时提交记录以及版本号
        --pretty=onel     //精简输出
         
git revert -n `版本号 shA1`   

git push -f //配合强制提交

```
**注意：** 这里可能会出现冲突，那么需要手动修改冲突的文件。而且要git add 文件名。

（2）提交，使用“git commit -m 版本名”，如：
```
git commit -m "revert test" 
git push
```



# 找回版本

## 场景
使用 git reset--hard 版本号 回退版本，再使用git push -f origin master强制推送后，就怎么都找不到所回退版本之前的所有提交记录。

1、使用 git fsck --lost-found 命令，找出当前被丢弃的提交  
2、使用git show 命令，查看该废弃的提交是不是你所需的提交  
3、使用git reset --hard 命令，回滚到所废弃的提交。


# 参考链接 
>[(137条消息) git回滚reset、revert、四种模式，超级详细_git revert_Liangyi_J的博客-CSDN博客](https://blog.csdn.net/qq_36125138/article/details/118606548)
>
>[(137条消息) git使用git reset --hard 版本号 回退版本后并强制提交，找不到所回退版本之前的所有提交记录。_git reset --hard 提交_韩知虹的博客-CSDN博客](https://blog.csdn.net/weixin_44709394/article/details/120725395)