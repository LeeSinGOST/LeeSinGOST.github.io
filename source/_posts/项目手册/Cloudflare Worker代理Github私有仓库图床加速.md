---
title: Cloudflare Worker代理Github图床加速
categories:
  - 项目手册
tags:
  - Github
  - Cloudflare
  - 图床
abbrlink: 57472
date: 2023-07-10 10:56:03
updated: 2023-07-10 22:06:17
---
# Cloudflare Worker代理Github图床加速

>使用自己的域名访问Github私有仓库包括图片在内的文件。

# 效果测试

如下
![8MB](https://pic.kokutou.space/img/202307101245813.jpg)


![2MB](https://pic.kokutou.space/img/202307101258093.jpg)

# 前置条件

- Github私有仓库
- Cloudflare注册并托管域名

# 详细步骤

## 注册私有仓库

首先，在github上建一个私有仓库。然后，在 GitHub 上生成一个 Personal access token（个人访问令牌），用于身份验证。在 GitHub 网站上登录账户，点击右上角用户头像，进入 Settings（设置）页面。在这个页面中左侧侧边栏选择 Developer settings（开发人员设置），然后点击 Personal access tokens（个人访问令牌）菜单里的 Token classic，点击 Generate new token 开始创建一个新的令牌，注意一定要选择 classic 方式。
![](images/487ded4093d1fcee10226579963c56b2.png)

> 在生成后的页面中会看到新生成的github令牌，该令牌后面会使用到。
> **务必将令牌保存起来**，放在一个安全的地方，页面关掉后就看不到了。

## 在 Cloudflare 上创建用于代理的 Worker

登录到 Cloudflare 的管理界面后，点击侧边栏的 “Workers and Pages” 选项，然后点击 “创建应用程序” 创建一个 Worker。

![](images/b4c46739a836c6a598afc803345d0479.png)

随便起个名部署，再进去编辑Worker,点击编辑代码。
编辑默认创建的worker.js
```js
// Website you intended to retrieve for users.
const upstream = "raw.githubusercontent.com";

// Custom pathname for the upstream website.
// --------(1) 填写代理的路径，格式为 /<用户>/<仓库名>/<分支>--------
const upstream_path = "/xxxx/xxxx/xxxx";

// github personal access token.
// -------------(2) 填写github令牌------------------
const github_token = "xxxxxxxx";

// Website you intended to retrieve for users using mobile devices.
const upstream_mobile = upstream;

// Countries and regions where you wish to suspend your service.
const blocked_region = [];

// IP addresses which you wish to block from using your service.
const blocked_ip_address = ["0.0.0.0", "127.0.0.1"];

// Whether to use HTTPS protocol for upstream address.
const https = true;

// Whether to disable cache.
const disable_cache = false;

// Replace texts.
const replace_dict = {
  $upstream: "$custom_domain",
};

addEventListener("fetch", (event) => {
  event.respondWith(fetchAndApply(event.request));
});

async function fetchAndApply(request) {
  const region = request.headers.get("cf-ipcountry")?.toUpperCase();
  const ip_address = request.headers.get("cf-connecting-ip");
  const user_agent = request.headers.get("user-agent");

  let response = null;
  let url = new URL(request.url);
  let url_hostname = url.hostname;

  if (https == true) {
    url.protocol = "https:";
  } else {
    url.protocol = "http:";
  }

  if (await device_status(user_agent)) {
    var upstream_domain = upstream;
  } else {
    var upstream_domain = upstream_mobile;
  }

  url.host = upstream_domain;
  if (url.pathname == "/") {
    url.pathname = upstream_path;
  } else {
    url.pathname = upstream_path + url.pathname;
  }

  if (blocked_region.includes(region)) {
    response = new Response(
      "Access denied: WorkersProxy is not available in your region yet.",
      {
        status: 403,
      }
    );
  } else if (blocked_ip_address.includes(ip_address)) {
    response = new Response(
      "Access denied: Your IP address is blocked by WorkersProxy.",
      {
        status: 403,
      }
    );
  } else {
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);

    new_request_headers.set("Host", upstream_domain);
    new_request_headers.set("Referer", url.protocol + "//" + url_hostname);
    new_request_headers.set("Authorization", "token " + github_token);

    let original_response = await fetch(url.href, {
      method: method,
      headers: new_request_headers,
      body: request.body,
    });

    connection_upgrade = new_request_headers.get("Upgrade");
    if (connection_upgrade && connection_upgrade.toLowerCase() == "websocket") {
      return original_response;
    }

    let original_response_clone = original_response.clone();
    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;

    if (disable_cache) {
      new_response_headers.set("Cache-Control", "no-store");
    } else {
      new_response_headers.set("Cache-Control", "max-age=43200000");
    }

    new_response_headers.set("access-control-allow-origin", "*");
    new_response_headers.set("access-control-allow-credentials", true);
    new_response_headers.delete("content-security-policy");
    new_response_headers.delete("content-security-policy-report-only");
    new_response_headers.delete("clear-site-data");

    if (new_response_headers.get("x-pjax-url")) {
      new_response_headers.set(
        "x-pjax-url",
        response_headers
          .get("x-pjax-url")
          .replace("//" + upstream_domain, "//" + url_hostname)
      );
    }

    const content_type = new_response_headers.get("content-type");
    if (
      content_type != null &&
      content_type.includes("text/html") &&
      content_type.includes("UTF-8")
    ) {
      original_text = await replace_response_text(
        original_response_clone,
        upstream_domain,
        url_hostname
      );
    } else {
      original_text = original_response_clone.body;
    }

    response = new Response(original_text, {
      status,
      headers: new_response_headers,
    });
  }
  return response;
}

async function replace_response_text(response, upstream_domain, host_name) {
  let text = await response.text();

  var i, j;
  for (i in replace_dict) {
    j = replace_dict[i];
    if (i == "$upstream") {
      i = upstream_domain;
    } else if (i == "$custom_domain") {
      i = host_name;
    }

    if (j == "$upstream") {
      j = upstream_domain;
    } else if (j == "$custom_domain") {
      j = host_name;
    }

    let re = new RegExp(i, "g");
    text = text.replace(re, j);
  }
  return text;
}

async function device_status(user_agent_info) {
  var agents = [
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod",
  ];
  var flag = true;
  for (var v = 0; v < agents.length; v++) {
    if (user_agent_info.indexOf(agents[v]) > 0) {
      flag = false;
      break;
    }
  }
  return flag;
}
```

如图，有2个地方的代码需要自己修改一下。第一个是代理的路径，需要改写成自己的用户/仓库/分支，用户和仓库可以在github私有仓库页的url上看到，如`https://github.com/wdsjxh/Pictures/`，wdsjxh是用户名，Pictures是仓库名，分支现在一般默认是main，之前是叫master。第二是令牌，需要修改成之前github上申请的令牌。

大概讲一下，这串代码的作用：
1. 反向代理了github仓库。
2. 使用令牌获取文件。
3. 开启了缓存，避免重复请求图片。  

最后“保存并部署”，服务就部署成功了。Cloudflare 会自动给新创建的 Worker 服务分配域名，但是这个域名非常容易被墙，接下来需要给 Worker 绑定自己购买的域名。

进入触发器，配置自定义域即可。
![](images/4c6b08a81a897e59564ed0d7a7ed6a17.png)

转自: [使用github私有仓库和Cloudflare Workers搭建个人图床](https://zhuanlan.zhihu.com/p/626135137)

# picgo图床管理

> 可选：用于图床管理

### 下载picgo

[picgo下载地址](https://github.com/Molunerfinn/PicGo/releases)

下载picgo并安装好后，按下图进行配置。仓库名为`用户/仓库`，分支为main，Token为保存的github令牌，存储路径我这里定义的是`img/`，域名为之前绑定的 Worker 服务的域名。

![](https://pic3.zhimg.com/80/v2-453ab5aae132fb54e7b6009509e9ed2a_720w.webp)

保存并设为默认图床后，可以上传几张图片试一下，也可配置上传重命名。

# 配置多仓库访问

> 如果有需要配置访问多个私人仓库的文件，可自行修改work.js，比如添加url层级用于判断所访问仓库。

在上述work.js中
```js
//找到配置代理路径那里自行修改
const upstream_path = "/name/resp/branch"
//在原有基础添加下面想增加的仓库
const upstream_path1 = "/name/resp1/branch1"

//如果要增加"/item"来识别另外个仓库resp1，增加if判断即可。
  url.host = upstream_domain;      //原有
  if (url.pathname == "/") {          //原有
    url.pathname = upstream_path;        //原有
  }else if(url.pathname.indexOf("/item")==0){                 //新增
    url.pathname = upstream_path1 + url.pathname.substring(5);//新增，数字5为"/item"长度
  }                                                           //新增
  else {                 //原有
    url.pathname = upstream_path + url.pathname;       //原有
  }               //原有
```

保存即可，这样的话就能在原有仓库基础上增加访问其他私有仓库的方式了，
例如  https://github.kokutou.top/pic/001.jpg  代表访问仓库0图床里pic目录下的001.jpg。
        https://github.kokutou.top/item/js/item.js  代表访问仓库1里js目录下的的item.js文件。  

>~~虽然访问速度也就那样，胜在白嫖~~