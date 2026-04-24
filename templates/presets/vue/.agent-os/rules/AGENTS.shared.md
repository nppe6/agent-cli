# 项目 Agent 规则

- 主流程统一使用 `Compound Engineering`。
- 先判定任务类型，再决定流程与需加载的项目级 skills。
- 命中多个 skills 时必须组合加载，并在该任务后续步骤持续生效。
- 如果某个必需 skill 缺失或无法读取，必须立即中断，明确提示缺失 skill，并让用户选择如何继续。

## 任务分流

1. 新增功能、页面、模块开发
   - 先判断是否属于小改动。
   - 若需求不清晰，或不属于小改动，先用 `ce:brainstorm`。
   - 按命中规则加载项目级 skills。
   - 再进入 `ce:work`、`ce:review`、`ce:compound`。
2. `bugfix`、报错排查、小范围修复
   - 默认先走小改动判定。
   - 若问题范围不清晰，或不属于小改动，先用 `ce:brainstorm`。
   - 必载 `test-driven-development`，并按命中场景补测试/调试类 skills。
   - 再进入 `ce:work`、`ce:review`、`ce:compound`。

## 小改动判定

- 仅涉及代码文件。
- 仅统计新增或修改后的实际代码行数，不计删除。
- 新增/修改总计不超过 50 行。
- 改动目标明确，无额外需求澄清。
- 若涉及架构、跨模块、API/数据结构、状态管理、路由、权限、公共组件、共享基础设施、脚手架/构建配置，或验收标准不明确，则不能按小改动处理。

## 项目级 skills 触发

- 设计稿 / MasterGo / 视觉还原 / 切图 / 设计转代码：`mastergo-to-code`
- Vue 开发默认：`vue-best-practices`
- Vue 路由：`vue-router-best-practices`
- Vue 状态管理：`vue-pinia-best-practices`
- Vue JSX / TSX：`vue-jsx-best-practices`
- Vue Options API：`vue-options-api-best-practices`
- Vue 测试 / 回归验证：`vue-testing-best-practices`
- Vue 运行时错误 / 白屏 / 响应式异常 / 生命周期异常：`vue-debug-guides`
- 用户明确要求真实流程验证：结合 Playwright MCP

## 补充

- 用户明确要求专项流程时，专项规则优先于默认小改动路径。
- 只要用户请求、文件路径、代码片段、报错信息、目录结构或上下文中出现命中条件，都视为触发。
- 具体专项细则以对应项目级 skill 的 `SKILL.md` 为准。
- `CLAUDE.md` 保持精简；共享规则统一写在这里，再通过 `pnpm agent-os:sync` 同步到根目录。
