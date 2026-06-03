import fs from 'node:fs';
import path from 'node:path';

export const SERVICE_ENCAPSULATION_POLICY_RELATIVE_PATH =
  'docs/plans/service-encapsulation-policy.json';

export class ServiceEncapsulationPolicyError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = 'ServiceEncapsulationPolicyError';
    this.issues = issues;
  }
}

const toPosixPath = (value) => value.split(path.sep).join('/');

const asStringArray = (value, key, issues) => {
  if (!Array.isArray(value)) {
    issues.push(`\`${key}\` must be an array.`);
    return [];
  }

  const normalized = [];
  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      issues.push(`\`${key}[${index}]\` must be a non-empty string.`);
      continue;
    }
    normalized.push(item.trim());
  }
  return normalized;
};

const assertNoDuplicates = (items, key, issues) => {
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
    issues.push(`\`${key}\` contains duplicates: ${Array.from(duplicates).join(', ')}`);
  }
};

const normalizeInteractionRules = (value, issues) => {
  if (!Array.isArray(value)) {
    issues.push('`interactionRules` must be an array.');
    return [];
  }

  const rules = [];
  const keys = [];
  for (const [index, rule] of value.entries()) {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      issues.push(`interactionRules[${index}] must be an object.`);
      continue;
    }

    const key = typeof rule.key === 'string' ? rule.key.trim() : '';
    const label = typeof rule.label === 'string' ? rule.label.trim() : '';

    if (!key) {
      issues.push(`interactionRules[${index}].key must be a non-empty string.`);
    } else if (!/^[a-z][A-Za-z0-9]*$/.test(key)) {
      issues.push(
        `interactionRules[${index}].key must match /^[a-z][A-Za-z0-9]*$/. Received: ${key}`,
      );
    }

    if (!label) {
      issues.push(`interactionRules[${index}].label must be a non-empty string.`);
    }

    if (key) {
      keys.push(key);
    }
    if (key && label) {
      rules.push({ key, label });
    }
  }

  assertNoDuplicates(keys, 'interactionRules.key', issues);
  if (rules.length === 0) {
    issues.push('`interactionRules` must define at least one valid rule.');
  }

  return rules;
};

const validateAllowedOutsideServicePatterns = (patterns, issues) => {
  for (const pattern of patterns) {
    try {
      new RegExp(pattern);
    } catch (error) {
      issues.push(
        `Invalid regex pattern in allowedOutsideServicePatterns: "${pattern}" (${String(error)})`,
      );
      continue;
    }

    if (!pattern.includes('packages\\/')) {
      issues.push(
        `Pattern "${pattern}" is too broad. It must include package-scoped path fragment "packages\\/".`,
      );
    }

    if (pattern === '.*' || pattern === '^.*$') {
      issues.push(`Pattern "${pattern}" is not allowed.`);
    }
  }
};

export function validateServiceEncapsulationPolicy(value) {
  const issues = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    issues.push('Policy root must be a JSON object.');
    return { policy: null, issues };
  }

  const infrastructurePackages = asStringArray(
    value.infrastructurePackages,
    'infrastructurePackages',
    issues,
  );
  const seamExemptPackages = asStringArray(
    value.seamExemptPackages,
    'seamExemptPackages',
    issues,
  );
  const rootServiceExportExemptPackages = asStringArray(
    value.rootServiceExportExemptPackages,
    'rootServiceExportExemptPackages',
    issues,
  );
  const allowedOutsideServicePatterns = asStringArray(
    value.allowedOutsideServicePatterns,
    'allowedOutsideServicePatterns',
    issues,
  );
  const interactionRules = normalizeInteractionRules(value.interactionRules, issues);

  assertNoDuplicates(infrastructurePackages, 'infrastructurePackages', issues);
  assertNoDuplicates(seamExemptPackages, 'seamExemptPackages', issues);
  assertNoDuplicates(
    rootServiceExportExemptPackages,
    'rootServiceExportExemptPackages',
    issues,
  );
  assertNoDuplicates(allowedOutsideServicePatterns, 'allowedOutsideServicePatterns', issues);
  validateAllowedOutsideServicePatterns(allowedOutsideServicePatterns, issues);

  if (infrastructurePackages.length === 0) {
    issues.push('`infrastructurePackages` must define at least one package.');
  }

  return {
    policy: {
      infrastructurePackages,
      seamExemptPackages,
      rootServiceExportExemptPackages,
      allowedOutsideServicePatterns,
      interactionRules,
    },
    issues,
  };
}

export function loadServiceEncapsulationPolicy({ rootDir = process.cwd() } = {}) {
  const policyPath = path.join(rootDir, SERVICE_ENCAPSULATION_POLICY_RELATIVE_PATH);
  const policySource = toPosixPath(path.relative(rootDir, policyPath));

  if (!fs.existsSync(policyPath)) {
    throw new ServiceEncapsulationPolicyError(`Policy file not found: ${policySource}`, [
      `Policy file not found: ${policySource}`,
    ]);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  } catch (error) {
    throw new ServiceEncapsulationPolicyError(
      `Policy file is not valid JSON: ${String(error)}`,
      [`Policy file is not valid JSON: ${String(error)}`],
    );
  }

  const { policy, issues } = validateServiceEncapsulationPolicy(parsed);
  if (!policy || issues.length > 0) {
    throw new ServiceEncapsulationPolicyError(
      `Policy file is invalid: ${issues.join('; ')}`,
      issues,
    );
  }

  return {
    policy,
    policySource,
  };
}
