const fs = require('fs');
const path = require('path');

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function copyDirectoryContents(sourceDirectory, destinationDirectory) {
  ensureDirectory(destinationDirectory);

  for (const entry of fs.readdirSync(sourceDirectory)) {
    const sourcePath = path.join(sourceDirectory, entry);
    const destinationPath = path.join(destinationDirectory, entry);
    fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
  }
}

module.exports = {
  copyDirectoryContents,
  ensureDirectory,
  removePathIfExists
};
