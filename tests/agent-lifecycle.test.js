const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const agentDoctor = require('../lib/actions/agent-doctor');
const agentInit = require('../lib/actions/agent-init');
const { createJoinerTask } = require('../lib/actions/agent-joiner');
const agentSync = require('../lib/actions/agent-sync');
const agentUpdate = require('../lib/actions/agent-update');

function createTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentos-cli-lifecycle-'));
}

async function runSilently(action) {
  const originalLog = console.log;
  console.log = () => {};

  try {
    return await action();
  }
  finally {
    console.log = originalLog;
  }
}

test('init writes manifest and template hashes for a single-tool install', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const manifest = JSON.parse(fs.readFileSync(path.join(projectDirectory, '.shelf', 'manifest.json'), 'utf8'));
  const hashes = JSON.parse(fs.readFileSync(path.join(projectDirectory, '.shelf', 'template-hashes.json'), 'utf8'));

  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.tools, ['codex']);
  assert.match(manifest.generatedFiles.join('\n'), /AGENTS\.md/);
  assert.match(manifest.generatedFiles.join('\n'), /\.codex\/skills\/agentos-brainstorm\/SKILL\.md/);
  assert.match(manifest.generatedFiles.join('\n'), /\.agents\/skills\/agentos-brainstorm\/SKILL\.md/);
  assert.match(manifest.generatedFiles.join('\n'), /\.codex\/agents\/implement\.md/);
  assert.equal(hashes.schemaVersion, 1);
  assert.equal(typeof hashes.files['AGENTS.md'].hash, 'string');
  assert.equal(typeof hashes.files['.agents/skills/agentos-brainstorm/SKILL.md'].hash, 'string');
  assert.equal(typeof hashes.files['.codex/agents/implement.md'].hash, 'string');
  assert.equal(typeof hashes.files['.shelf/manifest.json'].hash, 'string');
});

test('doctor reports a clean initialized project as ok', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex', 'claude']
  }));

  const result = await runSilently(() => agentDoctor(projectDirectory, { findPythonCommand: () => 'python3' }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.tools, ['codex', 'claude']);
  assert.equal(result.pythonCommand, 'python3');
});

test('doctor reports missing runtime scripts', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.rmSync(path.join(projectDirectory, '.shelf', 'scripts', 'task.py'), { force: true });

  const result = await runSilently(() => agentDoctor(projectDirectory, { findPythonCommand: () => 'python3' }));

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.includes('.shelf/scripts/task.py')), true);
});

test('doctor warns when Python runtime is missing', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const result = await runSilently(() => agentDoctor(projectDirectory, { findPythonCommand: () => null }));

  assert.equal(result.ok, true);
  assert.equal(result.warnings.some((warning) => warning.includes('Python runtime not found')), true);
});

test('sync dry-run reports missing projection files without writing them', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.rmSync(path.join(projectDirectory, 'AGENTS.md'), { force: true });

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.dryRun, true);
  assert.equal(result.changes.some((change) => change.path === 'AGENTS.md' && change.status === 'create'), true);
  assert.equal(fs.existsSync(path.join(projectDirectory, 'AGENTS.md')), false);
});

test('sync dry-run classifies clean generated files as unchanged', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.dryRun, true);
  assert.equal(result.changes.some((change) => change.path === 'AGENTS.md' && change.status === 'unchanged'), true);
});

test('sync preserves user content outside the managed AGENTS block', async () => {
  const projectDirectory = createTempProject();
  const agentsPath = path.join(projectDirectory, 'AGENTS.md');

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const original = fs.readFileSync(agentsPath, 'utf8');
  fs.writeFileSync(agentsPath, `# Local Notes\n\nKeep this.\n\n${original}`, 'utf8');
  const sharedRulesPath = path.join(projectDirectory, '.shelf', 'rules', 'AGENTS.shared.md');
  fs.writeFileSync(
    sharedRulesPath,
    fs.readFileSync(sharedRulesPath, 'utf8').replace('<!-- SHELF:END -->', 'New source rule.\n\n<!-- SHELF:END -->'),
    'utf8'
  );

  const result = await runSilently(() => agentSync(projectDirectory));
  const updated = fs.readFileSync(agentsPath, 'utf8');

  assert.equal(result.skippedPaths.includes('AGENTS.md'), false);
  assert.match(updated, /# Local Notes/);
  assert.match(updated, /Keep this\./);
  assert.match(updated, /New source rule\./);
});

test('sync dry-run classifies clean files as update when source changes', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const sharedRulesPath = path.join(projectDirectory, '.shelf', 'rules', 'AGENTS.shared.md');
  fs.writeFileSync(
    sharedRulesPath,
    fs.readFileSync(sharedRulesPath, 'utf8').replace('<!-- SHELF:END -->', 'New source rule.\n\n<!-- SHELF:END -->'),
    'utf8'
  );

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.changes.some((change) => change.path === 'AGENTS.md' && change.status === 'update'), true);
});

test('sync dry-run compares transformed Codex agent templates', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.appendFileSync(path.join(projectDirectory, '.shelf', 'agents', 'implement.md'), '\nSource agent update.\n', 'utf8');

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.changes.some((change) => change.path === '.codex/agents/implement.md' && change.status === 'update'), true);
});

test('sync dry-run classifies user-modified projection files without writing them', async () => {
  const projectDirectory = createTempProject();
  const agentsPath = path.join(projectDirectory, 'AGENTS.md');

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.writeFileSync(
    agentsPath,
    fs.readFileSync(agentsPath, 'utf8').replace('<!-- SHELF:END -->', 'User edited managed block.\n\n<!-- SHELF:END -->'),
    'utf8'
  );
  const before = fs.readFileSync(agentsPath, 'utf8');

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.changes.some((change) => change.path === 'AGENTS.md' && change.status === 'user-modified'), true);
  assert.equal(fs.readFileSync(agentsPath, 'utf8'), before);
});

test('sync dry-run classifies projection conflicts when source and user file both changed', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const sharedRulesPath = path.join(projectDirectory, '.shelf', 'rules', 'AGENTS.shared.md');
  fs.writeFileSync(
    sharedRulesPath,
    fs.readFileSync(sharedRulesPath, 'utf8').replace('<!-- SHELF:END -->', 'New source rule.\n\n<!-- SHELF:END -->'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(projectDirectory, 'AGENTS.md'),
    fs.readFileSync(path.join(projectDirectory, 'AGENTS.md'), 'utf8').replace('<!-- SHELF:END -->', 'User edited managed block.\n\n<!-- SHELF:END -->'),
    'utf8'
  );

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.changes.some((change) => change.path === 'AGENTS.md' && change.status === 'conflict'), true);
});

test('sync skips user-modified projection files during writes', async () => {
  const projectDirectory = createTempProject();
  const agentsPath = path.join(projectDirectory, 'AGENTS.md');

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.writeFileSync(
    agentsPath,
    fs.readFileSync(agentsPath, 'utf8').replace('<!-- SHELF:END -->', 'User edited managed block.\n\n<!-- SHELF:END -->'),
    'utf8'
  );
  const before = fs.readFileSync(agentsPath, 'utf8');

  const result = await runSilently(() => agentSync(projectDirectory));

  assert.deepEqual(result.skippedPaths, ['AGENTS.md']);
  assert.equal(fs.readFileSync(agentsPath, 'utf8'), before);
});

test('sync still skips user edits inside the managed AGENTS block', async () => {
  const projectDirectory = createTempProject();
  const agentsPath = path.join(projectDirectory, 'AGENTS.md');

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const content = fs.readFileSync(agentsPath, 'utf8').replace('<!-- SHELF:END -->', 'User edited managed block.\n\n<!-- SHELF:END -->');
  fs.writeFileSync(agentsPath, content, 'utf8');
  const result = await runSilently(() => agentSync(projectDirectory));

  assert.deepEqual(result.skippedPaths, ['AGENTS.md']);
});

test('sync regenerates missing projection files from .shelf', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.rmSync(path.join(projectDirectory, 'AGENTS.md'), { force: true });

  const result = await runSilently(() => agentSync(projectDirectory));

  assert.equal(result.dryRun, false);
  assert.equal(fs.existsSync(path.join(projectDirectory, 'AGENTS.md')), true);
  assert.equal(result.generatedFiles.includes('AGENTS.md'), true);
});

test('sync dry-run reports missing projected agent files', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.rmSync(path.join(projectDirectory, '.codex', 'agents', 'research.md'), { force: true });

  const result = await runSilently(() => agentSync(projectDirectory, { dryRun: true }));

  assert.equal(result.dryRun, true);
  assert.equal(result.changes.some((change) => change.path === '.codex/agents/research.md' && change.status === 'create'), true);
});

test('update creates backups before applying projection changes', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  fs.appendFileSync(path.join(projectDirectory, '.shelf', 'agents', 'research.md'), '\nUpdated research agent.\n', 'utf8');

  const result = await runSilently(() => agentUpdate(projectDirectory));

  assert.equal(result.updated, true);
  assert.equal(result.backups.some((backup) => backup.endsWith('.codex/agents/research.md')), true);
  assert.equal(fs.existsSync(path.join(projectDirectory, '.shelf', 'backups')), true);
});

test('joiner task creates onboarding task files', async () => {
  const projectDirectory = createTempProject();

  await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  const result = await runSilently(() => createJoinerTask('Ada Lovelace', projectDirectory));

  assert.equal(result.taskPath, '.shelf/tasks/00-join-ada-lovelace');
  assert.equal(fs.existsSync(path.join(projectDirectory, result.taskPath, 'task.json')), true);
  assert.match(fs.readFileSync(path.join(projectDirectory, result.taskPath, 'prd.md'), 'utf8'), /Onboard Ada Lovelace/);
});
