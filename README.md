# AIQA 研究站 / AIQA Probe

一个专注 AI-QA 的研究小站。零框架静态站点，源码在 `src/`，构建结果在 `dist/`。

GitHub 仓库：[STEVE-DENG/aiqaprobe](https://github.com/STEVE-DENG/aiqaprobe)

## 页面功能

- 两个真实开源项目档案：AI Proxy 与 App Test Agent。
- 六篇可展开、可按评测 / Agent / 工程主题筛选的研究笔记。
- 开源项目、GitHub 仓库和资料建议入口。
- 响应式布局、键盘操作、可见焦点和减少动态效果支持。

## 本地运行

```bash
npm run dev
```

打开 `http://localhost:4173`。

## 构建

```bash
npm run build
npm run preview
```

笔记建议通过 GitHub Issues 收集，站点本身不保存访客输入。

## 域名

正式地址是 `https://aiqaprobe.com`，域名由百度云管理，DNS 解析也在百度云完成。
HTTPS 证书由托管平台自动签发。

仓库只存放网站源码和构建脚本。DNS 导入文件及托管平台的本地配置不纳入版本控制。
