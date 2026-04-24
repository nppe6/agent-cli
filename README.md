# agentos-cli

用于把现有项目补齐一整套 AI 工作流配置。

## 适用场景

- 项目不是从模板新建的
- 需要快速注入 `AGENTS.md`、`.agent-os`、`.claude`、`.codex`
- 接受整套覆盖，不做内容合并

## 安装

```bash
npm install
npm link
```

全局安装后可使用 `agentos-cli`，如 PowerShell 拦截可改用 `agentos-cli.cmd`。

## 命令

```bash
agentos-cli -h
agentos-cli -v
agentos-cli agent init [target]
```

- `-h, --help`：查看帮助
- `-v, --version`：查看版本
- `agent init`：向目标项目注入完整 AI 工作流

## 参数

- `[target]`：目标目录，默认当前目录
- `-t, --target <path>`：显式指定目标目录
- `-p, --preset <preset>`：选择预设，当前仅支持 `vue`
- `--git-mode <track|ignore>`：指定注入后的文件是提交到 Git 还是追加到 `.gitignore`
- `-f, --force`：发现冲突时直接覆盖

`git mode` 是必选策略：未传 `--git-mode` 时，CLI 会主动询问。

## 注入内容

- `.agent-os/`
- `scripts/sync-agent-os.ps1`
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/skills/`
- `.codex/skills/`
- `package.json` 中的 `scripts.agent-os:sync`（若存在）

## 规则

- 发现已有配置时，默认先确认再覆盖
- 确认后执行全量覆盖，不做合并
- 选择 `ignore` 时，只会把忽略规则增量追加到目标项目 `.gitignore` 末尾
- 选择 `track` 时，只会移除 `agentos-cli` 自己追加的忽略块

## 示例

```bash
agentos-cli agent init -t D:\work\easy\test --git-mode track
agentos-cli agent init -t D:\work\easy\test --git-mode ignore --force
```
