# 自动开发工作台 v0.1

## 当前交付

- `/development/`：项目建议表单、Turnstile、项目/状态筛选、阶段记录、建议追踪链接、PR 和版本展示。
- `services/intake/`：Cloudflare Worker + D1，接收建议、脱敏进度、任务领取、阶段转换、心跳与暂停接口。
- `automation/runner.py`：出站轮询、DeepSeek 准入、Codex 计划/开发/独立代码审查、自动提交 PR、快进合并、版本标签和本地归档。
- `automation/container.py`：固定容器入口、只读规划和审查、开发会话续接、受限文件导出。
- `automation/proxy.py`：固定上游模型代理、指定模型、请求次数/字节/输出上限；开发进程无模型真实密钥。
- `automation/bootstrap.py`：私密配置初始化、无宿主挂载虚拟机、镜像构建及 macOS 后台服务安装。

**代码已实现；线上接收、真实模型执行和自动合并仍需要一次性接入凭据。未配置时禁用站内提交，不展示虚假任务。**

## 实际流程

建议 → 规则与 DeepSeek 安全准入 → Codex 只读计划 → Codex 开发 → 独立 Codex 代码审查 → 最多两轮修复 → 自动提交 PR → 非强制快进主分支 → 版本标签 → 归档。

无需人工批准和标签；不运行测试、项目脚本或依赖安装。失败自动停止该任务，不升级权限。三个项目只接受已配置路径内的小范围、兼容性源码/文档改动；拒绝依赖、工作流、脚本、权限配置、凭据和删除操作。

为使审查结果可可靠判断，首版使用 Codex CLI `exec --output-schema` 执行独立代码审查，显式要求检查 diff 与上下文，**不依靠 `codex review` 的自然语言输出猜测通过**；开发和审查均为 `gpt-6.1-sol` / `medium`。后续原生 review 有稳定的机器判定接口后可替换适配器。

使用 D1 保存队列与状态，而非把公开 GitHub 评论当作指令；公开 GitHub Issue 目前只是备用反馈入口，不会自动启动开发。

## 一次性接入

### 1. 后端与人机验证

需要 Cloudflare 账号和配置于 `aiqaprobe.com` 的 Turnstile widget；先配置域名，避免任何 hostname 通配。

```sh
cd services/intake
npx wrangler@4.158.0 login
npx wrangler@4.158.0 d1 create aiqa-development
```

把得到的 database ID 填入 `wrangler.jsonc` 的 `database_id`，把 Turnstile **公开 site key** 填入 `TURNSTILE_SITE_KEY`，保持 `SITE_ORIGIN` 为正式域名。

```sh
npx wrangler@4.158.0 secret put TURNSTILE_SECRET
npx wrangler@4.158.0 secret put RUNNER_TOKEN
npx wrangler@4.158.0 secret put RATE_SALT
npx wrangler@4.158.0 d1 migrations apply aiqa-development --remote
npx wrangler@4.158.0 deploy
```

`RUNNER_TOKEN` 与 `RATE_SALT` 各使用至少 32 字节的独立随机值；`RUNNER_TOKEN` 同步配置到本机 `AIQA_RUNNER_TOKEN`，不放进网页。API 不需要把本机暴露到公网。部署后的 HTTPS origin 写入 `src/development/config.json` 的 `apiBase`，重新构建并推送网站即可启用连接。

### 2. 模型和仓库授权

```sh
python3 automation/bootstrap.py init
```

填写本机 `~/.config/aiqa-automation/config.json` 和 `secrets.env`；环境文件权限必须为 `600`，不要把内容贴进聊天或提交 Git。

| 配置 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | 代理调用 Codex 指定模型，必须有该模型访问权限；桌面端登录不会自动转成 API 凭据 |
| `DEEPSEEK_API_KEY` | 建议准入审查，调用 `deepseek-flash` |
| `AIQA_RUNNER_TOKEN` | 与 API 的 RUNNER_TOKEN 一致 |
| `AIQA_GITHUB_APP_ID` | GitHub App 编号 |
| `AIQA_GITHUB_INSTALLATION_ID` | App 安装编号 |
| `AIQA_GITHUB_APP_KEY_FILE` | App 私钥文件的绝对路径，文件权限 `600` |

GitHub App 仅安装到 AI Proxy、App Test Agent、AI Judge Agent 三个仓库，只授予 Contents 和 Pull requests 的读写权限。每次获取的 installation token 只限这三个仓库。不能使用个人 SSH key、整机 GitHub 登录或全账号 PAT 替代隔离边界。

`config.json` 中 `api_base` 填实际后端 origin，按实际项目源码目录核对 `allowed`；未列出的目录默认不允许改。默认模型 ID 已从本机模型缓存核对，但 API 账号仍需具备相同模型权限。

### 3. 专用虚拟机和后台服务

```sh
python3 automation/bootstrap.py vm
python3 automation/bootstrap.py image
python3 automation/bootstrap.py install-service
```

VM 是独立 `aiqa` profile，禁止宿主挂载、SSH agent 转发和端口转发，不改变默认 Docker context。开发与审查容器没有宿主卷、Docker socket、个人登录或 GitHub 凭据。

安装服务前检查配置完整性；运行时还会核对 VM 的实际挂载、Docker socket 所属 profile 和镜像是否存在。不会在普通 Docker 环境或本机直接执行项目代码。

登录后后台服务每分钟轮询，电脑睡眠或关机时暂停。LaunchAgent 保持单实例，进程异常退出后按分钟重新启动。虚拟机仍需启动，停机后服务不会绕过检查。

## 会话与记录

- 每个任务有唯一编号，计划、开发和审查各自独立会话；同任务的自动修复续接开发会话。
- 独立审查只接收任务、计划、候选代码，不接收开发对话，避免跟随开发者自我评价。
- 本机 `~/.local/share/aiqa-automation/<task-id>.json` 保留计划、每轮 review、会话 ID、候选源码、审核哈希、PR、合并 SHA 与版本；`<task-id>.jsonl` 保留 Codex 原始事件，均不对公众开放。
- 原生 Codex 会话存储在容器临时盘，销毁后不保证可通过宿主 `codex resume` 打开；持久化事件可供追查，网站展示脱敏阶段与交付链接。
- 硬中断任务不盲目重跑：租约过期记为失败；下次启动清理本系统标记的遗留容器和网络，避免重复提交或重复合并。

## 版本和合并

每项目独立从已有正式 SemVer 标签继续；无正式标签从 `0.0.0` 开始，修复升 patch、兼容新增升 minor，首版拒绝破坏兼容变更。超过 100 个标签时停止，避免错误推断历史。

受控发布器仅通过 GitHub Git Data API 创建 blob/tree/commit，不在宿主检出或运行任务代码；提交绑定审查的基线与改动，非强制快进确保主分支前移时不会合入过时结果。现有分支保护阻止提交时停止，不绕过保护。

PR 保留改动，成功合入后打版本标签；不自动创建 GitHub Release、上传二进制或运行项目发布脚本。提交使用 `[skip ci]` 避免 push/PR 工作流自动运行测试；仓库自定义调度等独立触发不属于本执行器控制范围。版本标签不代表通过测试或已部署。

合并成功但打标签失败时，任务显示未完成，私密归档保留已合并 SHA 和 PR；不会把半完成流程当成功或重复执行合并。

## 安全边界与限额

- 入口验证 Turnstile token、hostname 与 action，校验长度、来源、字符及重复建议，IP 按日加盐摘要，不保存原始 IP。
- 每 IP 每日最多 3 次建议，默认全站每日 20 次；先限流再验证，模型执行前先做硬规则与准入审查。
- 全局串行领取和数据库状态比较，领取租约 1 小时；任务执行最多 40 分钟；阶段不允许随意跳转。
- 开发仅在内部网络运行，不能直接出网；仅能访问模型代理的固定 Responses 接口，代理只转发指定模型，真实密钥只在代理侧。
- 每任务模型请求最多 60 次、总请求体 12 MB、每响应最多 12,000 输出 token；每次建议准入最多 1,200 输出 token；实际账单预算还需在供应商侧配置。
- 读入模型前检查源码凭据；导出拒绝符号链接、硬链接、设备文件、异常路径和超大输出；发布前二次检查允许路径、文件数、敏感数据和变更规模。
- 计划/审查工作区由 root 持有且只读；开发容器非 root、无额外能力、只读系统盘，有内存、进程、CPU、临时盘和总时限。
- 连续三个执行故障熔断队列；被拒绝的建议不计入故障，避免攻击者用三条恶意建议直接触发熔断。
- 模型审查不是防攻击保证；VM、网络和发布权限隔离是实际防线。没有运行测试，不保证功能正确。

## 停止与恢复

立即停止本机服务：

```sh
launchctl bootout gui/$(id -u)/com.aiqaprobe.executor
colima stop --profile aiqa
```

API 的鉴权 `POST /runner/control` 接收 `{"paused":true}` 暂停领取；反向设置恢复。暂停后发布前的控制检查拒绝继续合并，已经提交的 GitHub 操作无法撤销。API 密钥仅限管理员保管。

## 本次开发验证范围

仅构建网页、解析代码语法、构建执行器镜像和检查部署认证条件；未运行自动化测试、浏览器测试、真实模型任务或自动合并。上线时应明确区分“界面可访问”与“执行服务已接入”。
