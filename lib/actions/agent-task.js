const path = require('path');
const { runShelfScript } = require('../utils/python-runtime');

async function agentTask(target = '.', args = [], options = {}, dependencies = {}) {
  const runner = dependencies.runShelfScript || runShelfScript;
  const result = runner(path.resolve(target), 'task.py', args.map(String), options);

  if (result.status !== 0) {
    throw new Error(`Task command failed with exit code ${result.status}.`);
  }

  return result;
}

module.exports = agentTask;
