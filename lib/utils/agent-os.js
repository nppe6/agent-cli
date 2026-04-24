const fs = require('fs');
const path = require('path');
const { copyDirectoryContents, ensureDirectory } = require('./fs');

const SUPPORTED_PRESETS = new Set(['vue']);
const TEMPLATE_ROOT = path.resolve(__dirname, '../../templates/presets');
const PACKAGE_SYNC_SCRIPT = 'powershell -ExecutionPolicy Bypass -File .\\scripts\\sync-agent-os.ps1';

const CONFLICT_TARGETS = [
  { relativePath: 'AGENTS.md', label: 'AGENTS.md', kind: 'path' },
  { relativePath: 'CLAUDE.md', label: 'CLAUDE.md', kind: 'path' },
  { relativePath: '.agent-os', label: '.agent-os/', kind: 'path' },
  { relativePath: '.claude', label: '.claude/', kind: 'path' },
  { relativePath: '.codex', label: '.codex/', kind: 'path' },
  { relativePath: path.join('scripts', 'sync-agent-os.ps1'), label: 'scripts/sync-agent-os.ps1', kind: 'path' }
];

function validatePreset(preset) {
  if (!SUPPORTED_PRESETS.has(preset)) {
    throw new Error(`Unsupported preset "${preset}". Available presets: ${Array.from(SUPPORTED_PRESETS).join(', ')}`);
  }

  return preset;
}

function resolvePresetRoot(preset) {
  return path.join(TEMPLATE_ROOT, preset);
}

function copyTemplateFiles({ preset, targetDirectory }) {
  const presetRoot = resolvePresetRoot(preset);
  const sourceAgentOs = path.join(presetRoot, '.agent-os');
  const sourceScriptsDirectory = path.join(presetRoot, 'scripts');
  const destinationAgentOs = path.join(targetDirectory, '.agent-os');
  const destinationScriptsDirectory = path.join(targetDirectory, 'scripts');

  fs.cpSync(sourceAgentOs, destinationAgentOs, { recursive: true, force: true });
  ensureDirectory(destinationScriptsDirectory);
  fs.cpSync(
    path.join(sourceScriptsDirectory, 'sync-agent-os.ps1'),
    path.join(destinationScriptsDirectory, 'sync-agent-os.ps1'),
    { force: true }
  );
}

function collectConflicts(targetDirectory) {
  const conflicts = [];

  for (const item of CONFLICT_TARGETS) {
    const absolutePath = path.join(targetDirectory, item.relativePath);
    if (fs.existsSync(absolutePath)) {
      conflicts.push({ ...item, absolutePath });
    }
  }

  const packageJsonPath = path.join(targetDirectory, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && Object.prototype.hasOwnProperty.call(packageJson.scripts, 'agent-os:sync')) {
      conflicts.push({
        label: 'package.json -> scripts.agent-os:sync',
        kind: 'package-script',
        absolutePath: packageJsonPath
      });
    }
  }

  return conflicts;
}

function syncAgentOs(targetDirectory) {
  const agentOsDirectory = path.join(targetDirectory, '.agent-os');
  const sharedRulesPath = path.join(agentOsDirectory, 'rules', 'AGENTS.shared.md');
  const claudeTemplatePath = path.join(agentOsDirectory, 'templates', 'CLAUDE.md');
  const skillsDirectory = path.join(agentOsDirectory, 'skills');
  const claudeSkillsDirectory = path.join(targetDirectory, '.claude', 'skills');
  const codexSkillsDirectory = path.join(targetDirectory, '.codex', 'skills');

  assertPathExists(sharedRulesPath, 'shared rules file');
  assertPathExists(claudeTemplatePath, 'Claude template');
  assertPathExists(skillsDirectory, 'skills directory');

  fs.copyFileSync(sharedRulesPath, path.join(targetDirectory, 'AGENTS.md'));
  fs.copyFileSync(claudeTemplatePath, path.join(targetDirectory, 'CLAUDE.md'));

  ensureDirectory(path.join(targetDirectory, '.claude'));
  ensureDirectory(path.join(targetDirectory, '.codex'));
  copyDirectoryContents(skillsDirectory, claudeSkillsDirectory);
  copyDirectoryContents(skillsDirectory, codexSkillsDirectory);
}

function updatePackageJsonScript(targetDirectory) {
  const packageJsonPath = path.join(targetDirectory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { updated: false };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['agent-os:sync'] = PACKAGE_SYNC_SCRIPT;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

  return { updated: true };
}

function assertPathExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing ${label}: ${targetPath}`);
  }
}

module.exports = {
  PACKAGE_SYNC_SCRIPT,
  collectConflicts,
  copyTemplateFiles,
  syncAgentOs,
  updatePackageJsonScript,
  validatePreset
};
