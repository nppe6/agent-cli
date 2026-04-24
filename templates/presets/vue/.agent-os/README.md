# Agent OS

`.agent-os` 是这个仓库里 Claude 和 Codex 工作流文件的唯一项目级源目录。

## 管理内容

- `rules/AGENTS.shared.md`
  - 共享规则的唯一真源
- `templates/CLAUDE.md`
  - 面向 Claude 的精简入口模板
- `skills/`
  - 可选的项目级 skills，会同步到 `.claude/skills/` 和 `.codex/skills/`

## 同步方式

修改 `.agent-os` 下任意文件后，执行 `pnpm agent-os:sync`。

同步命令会更新：

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/skills/`
- `.codex/skills/`

脚本只管理这些路径，会原地覆盖受管文件；不会主动清理其他工具将来在 `.claude/`、`.codex/` 下创建的额外文件。
