import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const POLICY_PATH = path.join(ROOT_DIR, 'docs', 'plans', 'service-encapsulation-policy.json');
const toPosixPath = (value) => value.split(path.sep).join('/');

const errors = [];
const warnings = [];

const pushError = (message) => errors.push(message);
const pushWarning = (message) => warnings.push(message);

const asStringArray = (value, key) => {
  if (!Array.isArray(value)) {
    pushError(`\`${key}\` must be an array.`);
    return [];
  }
  const invalid = value.filter((item) => typeof item !== 'string' || item.trim().length === 0);
  if (invalid.length > 0) {
    pushError(`\`${key}\` must contain non-empty strings only.`);
  }
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const assertNoDuplicates = (items, key) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item)) {
      duplicates.add(item);
      continue;
    }
    seen.add(item);
  }
  if (duplicates.size > 0) {
    pushError(`\`${key}\` contains duplicates: ${Array.from(duplicates).join(', ')}`);
  }
};

if (!fs.existsSync(POLICY_PATH)) {
  pushError(`Policy file not found: ${toPosixPath(path.relative(ROOT_DIR, POLICY_PATH))}`);
}

let policy = null;
if (errors.length === 0) {
  try {
    const raw = fs.readFileSync(POLICY_PATH, 'utf8');
    policy = JSON.parse(raw);
  } catch (error) {
    pushError(`Policy file is not valid JSON: ${String(error)}`);
  }
}

if (policy && typeof policy === 'object') {
  const infrastructurePackages = asStringArray(
    policy.infrastructurePackages,
    'infrastructurePackages'
  );
  const seamExemptPackages = asStringArray(policy.seamExemptPackages, 'seamExemptPackages');
  const rootServiceExportExemptPackages = asStringArray(
    policy.rootServiceExportExemptPackages,
    'rootServiceExportExemptPackages'
  );
  const allowedOutsideServicePatterns = asStringArray(
    policy.allowedOutsideServicePatterns,
    'allowedOutsideServicePatterns'
  );

  assertNoDuplicates(infrastructurePackages, 'infrastructurePackages');
  assertNoDuplicates(seamExemptPackages, 'seamExemptPackages');
  assertNoDuplicates(rootServiceExportExemptPackages, 'rootServiceExportExemptPackages');
  assertNoDuplicates(allowedOutsideServicePatterns, 'allowedOutsideServicePatterns');

  if (!Array.isArray(policy.interactionRules)) {
    pushError('`interactionRules` must be an array.');
  } else {
    const keys = [];
    for (const [index, rule] of policy.interactionRules.entries()) {
      if (!rule || typeof rule !== 'object') {
        pushError(`interactionRules[${index}] must be an object.`);
        continue;
      }
      const key = typeof rule.key === 'string' ? rule.key.trim() : '';
      const label = typeof rule.label === 'string' ? rule.label.trim() : '';
      if (!key) {
        pushError(`interactionRules[${index}].key must be a non-empty string.`);
      }
      if (!label) {
        pushError(`interactionRules[${index}].label must be a non-empty string.`);
      }
      if (key && !/^[a-z][A-Za-z0-9]*$/.test(key)) {
        pushError(
          `interactionRules[${index}].key must match /^[a-z][A-Za-z0-9]*$/. Received: ${key}`
        );
      }
      if (key) {
        keys.push(key);
      }
    }
    assertNoDuplicates(keys, 'interactionRules.key');
    if (keys.length === 0) {
      pushError('`interactionRules` must define at least one rule.');
    }
  }

  for (const pattern of allowedOutsideServicePatterns) {
    try {
      // Validate pattern syntax.
      // eslint-disable-next-line no-new
      new RegExp(pattern);
    } catch (error) {
      pushError(`Invalid regex pattern in allowedOutsideServicePatterns: "${pattern}" (${String(error)})`);
      continue;
    }

    // Guardrail: patterns should be package-scoped to avoid blanket bypasses.
    if (!pattern.includes('packages\\/')) {
      pushError(
        `Pattern "${pattern}" is too broad. It must include package-scoped path fragment "packages\\/".`
      );
    }

    if (pattern === '.*' || pattern === '^.*$') {
      pushError(`Pattern "${pattern}" is not allowed.`);
    }
  }

  if (infrastructurePackages.length === 0) {
    pushWarning('`infrastructurePackages` is empty. Confirm this is intentional.');
  }
}

if (warnings.length > 0) {
  console.warn('[ServicePolicy] Warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('[ServicePolicy] Validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[ServicePolicy] Validation passed: ${toPosixPath(path.relative(ROOT_DIR, POLICY_PATH))}`
  );
}
