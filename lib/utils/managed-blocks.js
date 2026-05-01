const DEFAULT_MARKERS = {
  AGENTS: {
    end: '<!-- SHELF:END -->',
    start: '<!-- SHELF:START -->'
  }
};

function replaceManagedBlock(currentContent, desiredBlock, markers) {
  const resolvedMarkers = markers || DEFAULT_MARKERS.AGENTS;
  const normalizedCurrent = normalizeNewlines(currentContent || '');
  const normalizedDesired = normalizeTrailingNewline(normalizeNewlines(desiredBlock || ''));
  const blockPattern = createManagedBlockPattern(resolvedMarkers);

  if (!blockPattern.test(normalizedCurrent)) {
    return {
      changed: normalizedCurrent !== normalizedDesired,
      content: normalizedDesired,
      replaced: false
    };
  }

  const nextContent = normalizeTrailingNewline(normalizedCurrent.replace(blockPattern, normalizeBlockForInlineReplacement(normalizedDesired)));

  return {
    changed: nextContent !== normalizedCurrent,
    content: nextContent,
    replaced: true
  };
}

function extractManagedBlock(content, markers) {
  const resolvedMarkers = markers || DEFAULT_MARKERS.AGENTS;
  const normalized = normalizeNewlines(content || '');
  const match = normalized.match(createManagedBlockPattern(resolvedMarkers));
  return match ? match[0] : null;
}

function createManagedBlockPattern(markers) {
  return new RegExp(`${escapeRegExp(markers.start)}\\n[\\s\\S]*?\\n${escapeRegExp(markers.end)}`, 'm');
}

function normalizeBlockForInlineReplacement(content) {
  return content.replace(/\n+$/g, '');
}

function normalizeNewlines(content) {
  return String(content).replace(/\r\n/g, '\n');
}

function normalizeTrailingNewline(content) {
  if (!content) {
    return '';
  }

  return `${content.replace(/\n+$/g, '')}\n`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  DEFAULT_MARKERS,
  extractManagedBlock,
  replaceManagedBlock
};
