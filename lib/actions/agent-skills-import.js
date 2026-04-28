const fs = require('fs');
const path = require('path');
const { ensureDirectory, removePathIfExists } = require('../utils/fs');

const IMPORT_MODE_SKIP = 'skip';
const IMPORT_MODE_OVERWRITE = 'overwrite';
const IMPORT_TARGET_AGENT_OS = 'agent-os';
const IMPORT_TARGET_CODEX = 'codex';
const IMPORT_TARGET_CLAUDE = 'claude';
const IMPORT_TARGET_AUTO = 'auto';

function discoverSkills(sourceDirectory) {
  const resolvedSource = path.resolve(sourceDirectory);

  assertDirectoryExists(resolvedSource, 'skills source');

  if (isSkillDirectory(resolvedSource)) {
    return [{
      name: path.basename(resolvedSource),
      sourcePath: resolvedSource
    }];
  }

  return fs.readdirSync(resolvedSource, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sourcePath = path.join(resolvedSource, entry.name);
      return { name: entry.name, sourcePath };
    })
    .filter((skill) => isSkillDirectory(skill.sourcePath));
}

async function importSkills(source, options = {}) {
  const targetDirectory = path.resolve(options.target || '.');
  const requestedMode = options.force ? IMPORT_MODE_OVERWRITE : options.mode || IMPORT_MODE_SKIP;
  const mode = normalizeImportMode(requestedMode);
  const destinationKind = normalizeDestination(options.to || IMPORT_TARGET_AUTO);
  const skills = discoverSkills(source);

  if (skills.length === 0) {
    throw new Error(`No skills found in source: ${path.resolve(source)}`);
  }

  const destinations = resolveDestinations(targetDirectory, destinationKind);
  if (destinations.length === 0) {
    throw new Error('No skills destination found. Run agent init first, or pass --to agent-os, --to codex, or --to claude.');
  }

  const imported = [];
  const skipped = [];
  const overwritten = [];

  for (const destination of destinations) {
    ensureDirectory(destination.path);

    for (const skill of skills) {
      const destinationPath = path.join(destination.path, skill.name);
      if (isSamePath(skill.sourcePath, destinationPath)) {
        skipped.push({ skill: skill.name, destination: destination.label });
        continue;
      }

      const exists = fs.existsSync(destinationPath);

      if (exists && mode === IMPORT_MODE_SKIP) {
        skipped.push({ skill: skill.name, destination: destination.label });
        continue;
      }

      if (exists) {
        removePathIfExists(destinationPath);
        overwritten.push({ skill: skill.name, destination: destination.label });
      }

      fs.cpSync(skill.sourcePath, destinationPath, { recursive: true, force: true });
      imported.push({ skill: skill.name, destination: destination.label });
    }
  }

  printSummary({ imported, skipped, overwritten, targetDirectory, mode });

  return {
    imported,
    mode,
    overwritten,
    skipped,
    targetDirectory
  };
}

function resolveDestinations(targetDirectory, destinationKind) {
  if (destinationKind === IMPORT_TARGET_AGENT_OS) {
    return [createDestination(targetDirectory, '.agent-os', 'agent-os')];
  }

  if (destinationKind === IMPORT_TARGET_CODEX) {
    return [createDestination(targetDirectory, '.codex', 'codex')];
  }

  if (destinationKind === IMPORT_TARGET_CLAUDE) {
    return [createDestination(targetDirectory, '.claude', 'claude')];
  }

  const agentOsDestination = createDestination(targetDirectory, '.agent-os', 'agent-os');
  if (fs.existsSync(agentOsDestination.path)) {
    return [agentOsDestination];
  }

  return [
    createDestination(targetDirectory, '.codex', 'codex'),
    createDestination(targetDirectory, '.claude', 'claude')
  ].filter((destination) => fs.existsSync(destination.path));
}

function createDestination(targetDirectory, rootName, label) {
  return {
    label,
    path: path.join(targetDirectory, rootName, 'skills')
  };
}

function isSkillDirectory(directoryPath) {
  return fs.existsSync(path.join(directoryPath, 'SKILL.md'));
}

function isSamePath(firstPath, secondPath) {
  return path.resolve(firstPath).toLowerCase() === path.resolve(secondPath).toLowerCase();
}

function normalizeImportMode(mode) {
  if (mode !== IMPORT_MODE_SKIP && mode !== IMPORT_MODE_OVERWRITE) {
    throw new Error('Import mode must be "skip" or "overwrite".');
  }

  return mode;
}

function normalizeDestination(destination) {
  const normalized = String(destination).trim().toLowerCase();
  const allowed = [
    IMPORT_TARGET_AUTO,
    IMPORT_TARGET_AGENT_OS,
    IMPORT_TARGET_CODEX,
    IMPORT_TARGET_CLAUDE
  ];

  if (!allowed.includes(normalized)) {
    throw new Error(`Import destination must be one of: ${allowed.join(', ')}.`);
  }

  return normalized;
}

function assertDirectoryExists(directoryPath, label) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    throw new Error(`Missing ${label}: ${directoryPath}`);
  }
}

function printSummary({ imported, skipped, overwritten, targetDirectory, mode }) {
  console.log('项目级 skills 导入完成。');
  console.log(`目标目录：${targetDirectory}`);
  console.log(`导入模式：${mode === IMPORT_MODE_OVERWRITE ? '覆盖' : '增量跳过'}`);

  if (imported.length > 0) {
    console.log(`已导入：${formatItems(imported)}`);
  }

  if (overwritten.length > 0) {
    console.log(`已覆盖：${formatItems(overwritten)}`);
  }

  if (skipped.length > 0) {
    console.log(`已跳过：${formatItems(skipped)}`);
  }
}

function formatItems(items) {
  return items
    .map((item) => `${item.skill} -> ${item.destination}`)
    .join('、');
}

module.exports = importSkills;
module.exports._private = {
  discoverSkills,
  resolveDestinations
};
