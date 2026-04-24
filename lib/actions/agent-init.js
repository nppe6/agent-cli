const path = require('path');
const {
  PACKAGE_SYNC_SCRIPT,
  collectConflicts,
  copyTemplateFiles,
  syncAgentOs,
  updatePackageJsonScript,
  validatePreset
} = require('../utils/agent-os');
const {
  GIT_MODE_IGNORE,
  GIT_MODE_TRACK,
  updateGitIgnore
} = require('../utils/gitignore');
const { ensureDirectory, removePathIfExists } = require('../utils/fs');

function createPrompt() {
  const inquirer = require('inquirer');
  return inquirer.createPromptModule();
}

function renderConflictList(conflicts) {
  return conflicts.map((conflict) => `- ${conflict.label}`).join('\n');
}

async function confirmOverwrite(conflicts, promptFactory = createPrompt) {
  console.log('Detected existing Agent OS workflow files. Continuing will overwrite:');
  console.log(renderConflictList(conflicts));
  console.log('Back up anything you need before continuing.');

  const prompt = promptFactory();
  const { overwrite } = await prompt([
    {
      type: 'confirm',
      name: 'overwrite',
      default: false,
      message: 'Overwrite existing workflow files?'
    }
  ]);

  return overwrite;
}

async function selectGitMode(promptFactory = createPrompt) {
  const prompt = promptFactory();
  const { gitMode } = await prompt([
    {
      type: 'list',
      name: 'gitMode',
      message: 'How should git treat the injected workflow files?',
      choices: [
        {
          name: 'Track in git',
          value: GIT_MODE_TRACK
        },
        {
          name: 'Ignore in git by appending entries to .gitignore',
          value: GIT_MODE_IGNORE
        }
      ]
    }
  ]);

  return gitMode;
}

async function agentInit(target = '.', options = {}, dependencies = {}) {
  const preset = validatePreset(options.preset || 'vue');
  const targetDirectory = path.resolve(target);
  const promptOverwrite = dependencies.promptOverwrite || confirmOverwrite;
  const promptGitMode = dependencies.promptGitMode || selectGitMode;
  const gitMode = options.gitMode || await promptGitMode();

  ensureDirectory(targetDirectory);

  const conflicts = collectConflicts(targetDirectory);
  if (conflicts.length > 0 && !options.force) {
    const confirmed = await promptOverwrite(conflicts);
    if (!confirmed) {
      console.log('Cancelled. No files were written.');
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
  const gitignoreResult = updateGitIgnore(targetDirectory, gitMode);

  console.log('Agent OS workflow injection completed.');
  console.log(`Target directory: ${targetDirectory}`);
  console.log(`Sync script: ${PACKAGE_SYNC_SCRIPT}`);
  console.log(`Git mode: ${gitMode}`);
  if (packageResult.updated) {
    console.log('package.json: updated scripts.agent-os:sync');
  }
  else {
    console.log('package.json: not found, skipped script injection');
  }
  if (gitignoreResult.updated) {
    console.log('.gitignore: updated incrementally');
  }

  return {
    aborted: false,
    gitMode,
    gitignoreUpdated: gitignoreResult.updated,
    packageUpdated: packageResult.updated,
    targetDirectory
  };
}

module.exports = agentInit;
