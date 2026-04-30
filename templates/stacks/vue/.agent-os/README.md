# Agent OS

`.agent-os` 是 Claude 和 Codex 工作流文件的唯一项目级源目录。单选 Codex、单选 Claude Code、或同时选择多个工具时都会生成。

## 管理内容

- `rules/AGENTS.shared.md`
  - 共享规则的唯一真源
- `templates/CLAUDE.md`
  - 面向 Claude 的精简入口模板
- `skills/`
  - 项目级 skills，`agentos-cli agent sync` 会同步到已启用工具的 skills 目录

## 同步方式

修改 `.agent-os` 下任意文件后，执行：

```bash
agentos-cli agent sync
```

同步命令会更新：

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/skills/`
- `.codex/skills/`

同步命令只管理这些投影路径。`--dry-run` 会预览 create/update/unchanged/user-modified/conflict 等状态；实际同步会跳过用户修改和冲突文件。

如需只读检查安装状态，执行：

```bash
agentos-cli agent doctor
```

## skills 迁移

需要把其他项目的本地 skills 迁移进来时，使用：

```bash
agentos-cli agent skills import <source>
```

未指定 `--mode` 时会先确认导入位置，再选择增量或覆盖；需要直接覆盖时加 `--mode overwrite`。导入完成后执行 `agentos-cli agent sync`，把 `.agent-os/skills/` 同步到已启用的 Agent 工具目录。

## Compound Engineering 依赖边界

`Compound Engineering` 是优先使用的全局增强流程，不是这个脚手架的硬依赖。

如果用户本机 Codex / Claude Code 没有安装或无法读取 `Compound Engineering`，Agent 应按 `rules/AGENTS.shared.md` 中的“内置降级流程”继续工作。项目级 Vue skills 由本目录同步或复制到所选工具目录，属于项目自带能力。
