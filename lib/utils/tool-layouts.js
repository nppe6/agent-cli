const fs = require('fs');
const path = require('path');

const TEMPLATE_TOOLS_DIRECTORY = path.resolve(__dirname, '../../templates/tools');
const TOOL_LABELS = {
  claude: 'Claude Code',
  codex: 'Codex'
};

const TOOL_LAYOUTS = loadToolLayouts();

function loadToolLayouts() {
  const layouts = {};

  for (const tool of ['codex', 'claude']) {
    const toolJsonPath = path.join(TEMPLATE_TOOLS_DIRECTORY, tool, 'tool.json');
    const metadata = JSON.parse(fs.readFileSync(toolJsonPath, 'utf8'));
    const skillsDirectory = metadata.skillsDirectory || metadata.skillsDir;
    const rootDirectory = path.dirname(skillsDirectory);

    layouts[metadata.name] = {
      agentsDirectory: metadata.agentsDirectory || metadata.agentsDir,
      entryFile: metadata.entryFile,
      label: TOOL_LABELS[metadata.name] || metadata.name,
      managedPaths: [metadata.entryFile, `${rootDirectory}/`],
      optionalDirs: metadata.optionalDirs || [],
      rootDirectory,
      skillsDirectory
    };
  }

  return layouts;
}

function getAllToolLayouts() {
  return TOOL_LAYOUTS;
}

function getToolLayout(tool) {
  const layout = TOOL_LAYOUTS[tool];
  if (!layout) {
    throw new Error(`Unsupported tool layout: ${tool}`);
  }

  return layout;
}

module.exports = {
  TOOL_LAYOUTS,
  getAllToolLayouts,
  getToolLayout
};
