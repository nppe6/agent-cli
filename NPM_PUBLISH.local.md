# npm 发布操作文档

本文档仅供本地使用，不提交到 Git。

## 1. 发布前准备

确认已经具备以下条件：

- 已有可用的 npm 账号
- npm 账号邮箱已验证
- GitHub 仓库已经可访问
- 当前项目代码已经准备完成

## 2. 检查 `package.json`

重点确认以下字段：

- `name`
- `version`
- `description`
- `bin`
- `files`
- `repository`
- `homepage`
- `bugs`
- `license`

建议使用作用域包名，例如：

```json
"name": "agentos-cli"
```

如果使用作用域包，首次发布需要加 `--access public`。

## 3. 登录 npm

在项目目录执行：

```bash
npm login
```

登录完成后可执行：

```bash
npm whoami
```

如果能输出当前用户名，说明登录成功。

## 4. 检查包名是否已被占用

```bash
npm view agentos-cli version
```

如果返回 404，一般表示该包名还没有发布。

## 5. 检查实际发布内容

```bash
npm pack --dry-run
```

重点确认以下内容：

- `bin/`
- `lib/`
- `templates/`
- `README.md`
- 不应包含 `node_modules/`
- 不应包含本地临时文件

## 6. 运行测试

```bash
npm test
```

如果测试失败，先修复再发布。

## 7. 正式发布 使用 token 方式进行发布 
- 注意这里的 token 是有时间期限的 如果发布失败 注意检查是否是因为过期导致

```bash
$token = Read-Host "请输入 npm token"
$tempNpmrc = Join-Path $env:TEMP "npmrc-temp"
"registry=https://registry.npmjs.org/" | Set-Content -Path $tempNpmrc -Encoding ASCII
"//registry.npmjs.org/:_authToken=$token" | Add-Content -Path $tempNpmrc -Encoding ASCII
$env:NPM_CONFIG_USERCONFIG = $tempNpmrc

npm.cmd whoami
npm.cmd publish
```
``` bash
推荐做法
如果这次只是小修复，用：

npm version patch
npm publish

如果是新增功能但兼容旧版，用：

npm version minor
npm publish

如果有不兼容变更，用：

npm version major
npm publish
```