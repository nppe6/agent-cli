const fs = require('fs');
const path = require('path');

const GIT_MODE_TRACK = 'track';
const GIT_MODE_IGNORE = 'ignore';
const GITIGNORE_BLOCK_START = '# agentos-cli: injected-agent-os:start';
const GITIGNORE_BLOCK_END = '# agentos-cli: injected-agent-os:end';
const GITIGNORE_ENTRIES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.agent-os/',
  '.claude/',
  '.codex/',
  'scripts/sync-agent-os.ps1'
];

function updateGitIgnore(targetDirectory, gitMode) {
  const resolvedGitMode = resolveGitMode(gitMode);
  const gitignorePath = path.join(targetDirectory, '.gitignore');
  const currentContent = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';
  const contentWithoutBlock = stripManagedBlock(currentContent);

  if (resolvedGitMode === GIT_MODE_TRACK) {
    if (contentWithoutBlock === currentContent) {
      return { updated: false, gitMode: resolvedGitMode };
    }

    if (contentWithoutBlock.length === 0) {
      fs.rmSync(gitignorePath, { force: true });
      return { updated: true, gitMode: resolvedGitMode };
    }

    fs.writeFileSync(gitignorePath, contentWithoutBlock, 'utf8');
    return { updated: true, gitMode: resolvedGitMode };
  }

  const managedBlock = `${createManagedBlock()}\n`;
  const nextContent = currentContent.length === 0
    ? managedBlock
    : `${trimTrailingNewlines(contentWithoutBlock)}\n\n${createManagedBlock()}\n`;

  if (nextContent === currentContent) {
    return { updated: false, gitMode: resolvedGitMode };
  }

  fs.writeFileSync(gitignorePath, nextContent, 'utf8');
  return { updated: true, gitMode: resolvedGitMode };
}

function createManagedBlock() {
  return [
    GITIGNORE_BLOCK_START,
    ...GITIGNORE_ENTRIES,
    GITIGNORE_BLOCK_END
  ].join('\n');
}

function stripManagedBlock(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const escapedStart = escapeRegExp(GITIGNORE_BLOCK_START);
  const escapedEnd = escapeRegExp(GITIGNORE_BLOCK_END);
  const blockPattern = new RegExp(`(?:\\n|^)${escapedStart}\\n[\\s\\S]*?\\n${escapedEnd}(?=\\n|$)`, 'g');
  const stripped = normalized.replace(blockPattern, '').replace(/\n{3,}/g, '\n\n');
  return normalizeTrailingNewline(stripped);
}

function normalizeTrailingNewline(content) {
  if (content.length === 0) {
    return '';
  }

  return `${trimTrailingNewlines(content)}\n`;
}

function trimTrailingNewlines(content) {
  return content.replace(/\r\n/g, '\n').replace(/\n+$/g, '');
}

function resolveGitMode(gitMode) {
  if (gitMode !== GIT_MODE_TRACK && gitMode !== GIT_MODE_IGNORE) {
    throw new Error('gitMode must be "track" or "ignore".');
  }

  return gitMode;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  GITIGNORE_BLOCK_END,
  GITIGNORE_BLOCK_START,
  GIT_MODE_IGNORE,
  GIT_MODE_TRACK,
  updateGitIgnore
};
