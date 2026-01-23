const CHECKLIST_PREFIX = '[Checklist] ';

export const stripChecklistPrefix = (title) => {
  const trimmed = title.trim();
  if (trimmed.startsWith(CHECKLIST_PREFIX)) {
    return trimmed.slice(CHECKLIST_PREFIX.length).trim();
  }
  return trimmed;
};

export const hasChecklistPrefix = (title) => title.trim().startsWith(CHECKLIST_PREFIX);

export const ensureChecklistPrefix = (title) => {
  const trimmed = title.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith(CHECKLIST_PREFIX)) return trimmed;
  return `${CHECKLIST_PREFIX}${trimmed}`;
};

export { CHECKLIST_PREFIX };
