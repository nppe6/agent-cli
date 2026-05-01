const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const agentInit = require('../lib/actions/agent-init');
const { detectMonorepo } = require('../lib/utils/monorepo');
const { getPlatform } = require('../lib/utils/platform-registry');

function createTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentos-cli-platform-'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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

test('platform registry describes Codex and Claude capabilities', () => {
  const codex = getPlatform('codex');
  const claude = getPlatform('claude');

  assert.equal(codex.capabilities.openAgentSkills, true);
  assert.equal(codex.capabilities.pullContextPrelude, true);
  assert.equal(claude.capabilities.hooks, true);
  assert.equal(claude.capabilities.settings, true);
});

test('monorepo detector reads package.json workspaces', () => {
  const projectDirectory = createTempProject();
  writeJson(path.join(projectDirectory, 'package.json'), {
    workspaces: ['packages/*']
  });
  writeJson(path.join(projectDirectory, 'packages', 'web', 'package.json'), {
    name: '@demo/web'
  });
  writeJson(path.join(projectDirectory, 'packages', 'api', 'package.json'), {
    name: '@demo/api'
  });

  const packages = detectMonorepo(projectDirectory);

  assert.deepEqual(packages.map((pkg) => pkg.path), ['packages/api', 'packages/web']);
  assert.deepEqual(packages.map((pkg) => pkg.name), ['@demo/api', '@demo/web']);
});

test('init reports detected workspace packages', async () => {
  const projectDirectory = createTempProject();
  writeJson(path.join(projectDirectory, 'package.json'), {
    workspaces: ['packages/*']
  });
  writeJson(path.join(projectDirectory, 'packages', 'web', 'package.json'), {
    name: '@demo/web'
  });

  const result = await runSilently(() => agentInit(projectDirectory, {
    force: true,
    gitMode: 'track',
    stack: 'core',
    tools: ['codex']
  }));

  assert.equal(result.detectedPackages.length, 1);
  assert.equal(result.detectedPackages[0].path, 'packages/web');
});
