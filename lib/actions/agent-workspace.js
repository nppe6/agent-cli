const path = require('path');
const { runShelfScript } = require('../utils/python-runtime');

async function getWorkspaceContext(target = '.', options = {}, dependencies = {}) {
  const runner = dependencies.runShelfScript || runShelfScript;
  const args = [];

  if (options.json) {
    args.push('--json');
  }

  const result = runner(path.resolve(target), 'get_context.py', args, options);

  if (result.status !== 0) {
    throw new Error(`Workspace context command failed with exit code ${result.status}.`);
  }

  return result;
}

async function addWorkspaceSession(target = '.', options = {}, dependencies = {}) {
  if (!options.title || !String(options.title).trim()) {
    throw new Error('Session title is required.');
  }

  const runner = dependencies.runShelfScript || runShelfScript;
  const args = ['--title', String(options.title).trim()];
  appendOption(args, '--commit', options.commit);
  appendOption(args, '--summary', options.summary);
  appendOption(args, '--content-file', options.contentFile);
  appendOption(args, '--package', options.package);
  appendOption(args, '--branch', options.branch);

  if (options.noCommit) {
    args.push('--no-commit');
  }
  if (options.stdin) {
    args.push('--stdin');
  }

  const result = runner(path.resolve(target), 'add_session.py', args, options);

  if (result.status !== 0) {
    throw new Error(`Workspace add-session command failed with exit code ${result.status}.`);
  }

  return result;
}

function appendOption(args, flag, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  args.push(flag, String(value));
}

module.exports = {
  addWorkspaceSession,
  getWorkspaceContext
};
