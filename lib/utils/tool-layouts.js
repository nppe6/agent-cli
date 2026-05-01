const {
  PLATFORM_REGISTRY,
  getAllPlatforms,
  getPlatform
} = require('./platform-registry');

function getAllToolLayouts() {
  return getAllPlatforms();
}

function getToolLayout(tool) {
  return getPlatform(tool);
}

module.exports = {
  TOOL_LAYOUTS: PLATFORM_REGISTRY,
  getAllToolLayouts,
  getToolLayout
};
