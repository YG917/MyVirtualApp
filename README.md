# Newshadow 介绍页

仍在开发中的免 root Android 应用多实例兼容框架 Newshadow 的介绍页。纯静态 HTML/CSS/JS，无构建步骤，不加载外部字体、图片或服务。

## 在线访问

<https://yg917.github.io/MyVirtualApp/>

站点由 `.github/workflows/pages.yml` 发布：每次推送到 `main` 都会自动重新部署，也可以在 Actions 页手动运行。

第一次启用只需做一次：仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，然后在 Actions 页重新运行 “Deploy to GitHub Pages”。

发布的只有 `index.html` 和 `assets/`，README 与 `.github/` 不会出现在站点上。

## 目录

```
.github/workflows/pages.yml  发布到 GitHub Pages
index.html                   页面内容与三张原创 SVG 图
assets/css/style.css         视觉：冷灰白底、石墨黑文字、信号橙表示“分身所见”
assets/js/main.js            目录折叠、当前章节、图形描线、滚动点亮轨道、视差
assets/img/favicon.svg       标记：实心圆是宿主，橙色描边圆是分身的视图
```

## 页面结构

1. 首屏：主张与图 01（视点、投影面与实物）
2. 01 是什么：免 root、多个分身、各自的视图
3. 02 三层：图 02 固定在左侧，右侧滚到哪一层，图中就点亮哪条轨道
4. 03 状态：还在开发中

## 本地预览

直接用浏览器打开 `index.html`，或在本目录运行：

```bash
python -m http.server 8080
```

## 尚缺的真实入口

页面目前没有下载、文档或源码入口，也没有任何占位按钮。拿到真实地址后，在 `index.html` 的 03 状态段落里、`back-links` 之前加入这些链接。
