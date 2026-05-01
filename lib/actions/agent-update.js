const fs = require('fs');
const path = require('path');
const agentSync = require('./agent-sync');
const {
  SOURCE_DIRECTORY_NAME,
  collectProjectionTemplates,
  getProjectionTemplateContent,
  normalizeTools,
  readAgentOsManifest,
  recordAgentOsMetadata,
  syncAgentOs,
  validateStack
} = require('../utils/agent-os');
const { ensureDirectory } = require('../utils/fs');

async function agentUpdate(target = '.', options = {}) {
  const targetDirectory = path.resolve(target);
  const manifest = readAgentOsManifest(targetDirectory);

  if (!manifest) {
    throw new Error(`Missing ${SOURCE_DIRECTORY_NAME}/manifest.json. Run agent init first.`);
  }

  const stack = validateStack(options.stack || firstStack(manifest) || 'core');
  const tools = normalizeTools(options.tools || manifest.tools || []);
  const preview = await agentSync(targetDirectory, { dryRun: true, stack, tools });
  const riskyChanges = preview.changes.filter((change) => change.status === 'user-modified' || change.status === 'conflict');

  if (options.dryRun) {
    return {
      ...preview,
      backups: [],
      updated: false
    };
  }

  if (riskyChanges.length > 0 && !options.force) {
    printBlockedUpdate(riskyChanges);
    return {
      ...preview,
      backups: [],
      blocked: true,
      updated: false
    };
  }

  const templates = collectProjectionTemplates(targetDirectory, tools, stack);
  const backupPaths = createProjectionBackups(targetDirectory, templates);
  const generatedFiles = syncAgentOs(targetDirectory, tools, stack);
  const metadataResult = recordAgentOsMetadata(targetDirectory, {
    generatedFiles: templates.map((template) => template.path),
    stack,
    tools
  });

  console.log(`AgentOS Shelf update complete: wrote ${generatedFiles.length} projection files and tracked ${Object.keys(metadataResult.hashes).length} hashes.`);
  if (backupPaths.length > 0) {
    console.log(`Backups: ${path.join(SOURCE_DIRECTORY_NAME, 'backups')}`);
  }

  return {
    backups: backupPaths,
    blocked: false,
    changes: preview.changes,
    dryRun: false,
    generatedFiles,
    targetDirectory,
    tools,
    updated: true
  };
}

function createProjectionBackups(targetDirectory, templates) {
  const stamp = createTimestamp();
  const backupRoot = path.join(targetDirectory, SOURCE_DIRECTORY_NAME, 'backups', stamp);
  const backups = [];

  for (const template of templates) {
    const relativePath = template.path;
    const absolutePath = path.join(targetDirectory, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      continue;
    }

    const currentContent = fs.readFileSync(absolutePath, 'utf8');
    const desiredContent = getProjectionTemplateContent(template);
    if (currentContent === desiredContent || isManagedBlockUnchanged(template, currentContent, desiredContent)) {
      continue;
    }

    const backupPath = path.join(backupRoot, relativePath);
    ensureDirectory(path.dirname(backupPath));
    fs.copyFileSync(absolutePath, backupPath);
    backups.push(normalizeRelativePath(path.relative(targetDirectory, backupPath)));
  }

  return backups;
}

function isManagedBlockUnchanged(template, currentContent, desiredContent) {
  if (!template.managedBlock) {
    return false;
  }

  const { extractManagedBlock } = require('../utils/managed-blocks');
  return extractManagedBlock(currentContent) === extractManagedBlock(desiredContent);
}

function printBlockedUpdate(riskyChanges) {
  console.log('AgentOS Shelf update blocked because user-modified or conflicting projection files were detected:');
  for (const change of riskyChanges) {
    console.log(`- ${change.path} (${change.status})`);
  }
  console.log('Run agent sync --dry-run to inspect the changes, or rerun update with --force after reviewing.');
}

function createTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function firstStack(manifest) {
  return Array.isArray(manifest.stacks) && manifest.stacks.length > 0
    ? manifest.stacks[0]
    : 'core';
}

function normalizeRelativePath(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

module.exports = agentUpdate;
module.exports._private = {
  createTimestamp
};
