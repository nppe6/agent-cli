const fs = require('fs');
const path = require('path');
const {
  PACKAGE_SYNC_SCRIPT,
  collectConflicts,
  copyTemplateFiles,
  syncAgentOs,
  updatePackageJsonScript,
  validatePreset
} = require('../utils/agent-os');
const { ensureDirectory, removePathIfExists } = require('../utils/fs');

function createPrompt() {
  const inquirer = require('inquirer');
  return inquirer.createPromptModule();
}

function renderConflictList(conflicts) {
  return conflicts.map((conflict) => `- ${conflict.label}`).join('\n');
}

async function confirmOverwrite(conflicts, promptFactory = createPrompt) {
  console.log('检测到当前项目已有 AI 工作流配置，继续会直接覆盖以下内容：');
  console.log(renderConflictList(conflicts));
  console.log('如需保留，请先退出并自行备份，再重新执行命令。');

  const prompt = promptFactory();
  const { overwrite } = await prompt([
    {
      type: 'confirm',
      name: 'overwrite',
      default: false,
      message: '是否确认覆盖？'
    }
  ]);

  return overwrite;
}

async function agentInit(target = '.', options = {}, dependencies = {}) {
  const preset = validatePreset(options.preset || 'vue');
  const targetDirectory = path.resolve(target);
  const promptOverwrite = dependencies.promptOverwrite || confirmOverwrite;

  ensureDirectory(targetDirectory);

  const conflicts = collectConflicts(targetDirectory);
  if (conflicts.length > 0 && !options.force) {
    const confirmed = await promptOverwrite(conflicts);
    if (!confirmed) {
      console.log('已取消，未写入任何文件。');
      return { aborted: true };
    }
  }

  for (const conflict of conflicts) {
    if (conflict.kind === 'package-script') {
      continue;
    }

    removePathIfExists(conflict.absolutePath);
  }

  copyTemplateFiles({ preset, targetDirectory });
  syncAgentOs(targetDirectory);
  const packageResult = updatePackageJsonScript(targetDirectory);

  console.log('Agent OS 工作流已注入完成。');
  console.log(`目标目录: ${targetDirectory}`);
  console.log(`同步脚本: ${PACKAGE_SYNC_SCRIPT}`);
  if (packageResult.updated) {
    console.log('package.json: 已写入 agent-os:sync 脚本。');
  }
  else {
    console.log('package.json: 未找到，已跳过脚本注入。');
  }

  return {
    aborted: false,
    targetDirectory,
    packageUpdated: packageResult.updated
  };
}

module.exports = agentInit;
