import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const POLICY_RELATIVE_PATH = 'docs/plans/service-encapsulation-policy.json';
const POLICY_PATH = path.join(ROOT_DIR, POLICY_RELATIVE_PATH);

const REQUIRED_REVIEW_LABEL = 'service-policy-reviewed';
const REQUIRED_HIGH_RISK_LABEL = 'service-policy-high-risk-reviewed';

const HIGH_RISK_KEYS = new Set([
  'infrastructurePackages',
  'seamExemptPackages',
  'rootServiceExportExemptPackages',
  'allowedOutsideServicePatterns'
]);

const MEDIUM_RISK_KEYS = new Set(['interactionRules']);

const readJson = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON ${filePath}: ${String(error)}`);
  }
};

const toStable = (value) => JSON.stringify(value ?? null);

const parseLabels = () => {
  const rawJson = process.env.POLICY_PR_LABELS_JSON || '[]';
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } catch {
    return [];
  }
};

const hasLabel = (labels, label) => labels.includes(label);

const main = () => {
  const labels = parseLabels();
  const basePolicyPath = process.env.POLICY_BASE_FILE;

  if (!basePolicyPath) {
    console.log(
      '[ServicePolicyGate] Env `POLICY_BASE_FILE` not provided. Skipping review-gate diff check.'
    );
    return;
  }

  if (!fs.existsSync(POLICY_PATH)) {
    console.error(`[ServicePolicyGate] Head policy file missing: ${POLICY_RELATIVE_PATH}`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(basePolicyPath)) {
    console.error(`[ServicePolicyGate] Base policy file missing: ${basePolicyPath}`);
    process.exitCode = 1;
    return;
  }

  const basePolicy = readJson(basePolicyPath);
  const headPolicy = readJson(POLICY_PATH);

  const keys = new Set([
    ...Object.keys(basePolicy || {}),
    ...Object.keys(headPolicy || {})
  ]);

  const changedKeys = Array.from(keys)
    .filter((key) => toStable(basePolicy?.[key]) !== toStable(headPolicy?.[key]))
    .sort((a, b) => a.localeCompare(b));

  if (changedKeys.length === 0) {
    console.log('[ServicePolicyGate] Policy file changed but no effective content differences detected.');
    return;
  }

  const highRiskChanges = changedKeys.filter((key) => HIGH_RISK_KEYS.has(key));
  const mediumRiskChanges = changedKeys.filter((key) => MEDIUM_RISK_KEYS.has(key));
  const otherChanges = changedKeys.filter(
    (key) => !HIGH_RISK_KEYS.has(key) && !MEDIUM_RISK_KEYS.has(key)
  );

  console.log(`[ServicePolicyGate] Changed keys: ${changedKeys.join(', ')}`);
  if (highRiskChanges.length > 0) {
    console.log(`[ServicePolicyGate] High-risk keys: ${highRiskChanges.join(', ')}`);
  }
  if (mediumRiskChanges.length > 0) {
    console.log(`[ServicePolicyGate] Medium-risk keys: ${mediumRiskChanges.join(', ')}`);
  }
  if (otherChanges.length > 0) {
    console.log(`[ServicePolicyGate] Other keys: ${otherChanges.join(', ')}`);
  }
  console.log(`[ServicePolicyGate] PR labels: ${labels.join(', ') || '(none)'}`);

  const missing = [];
  if (!hasLabel(labels, REQUIRED_REVIEW_LABEL)) {
    missing.push(REQUIRED_REVIEW_LABEL);
  }
  if (highRiskChanges.length > 0 && !hasLabel(labels, REQUIRED_HIGH_RISK_LABEL)) {
    missing.push(REQUIRED_HIGH_RISK_LABEL);
  }

  if (missing.length > 0) {
    console.error(
      `[ServicePolicyGate] Missing required label(s): ${missing.join(', ')}.`
    );
    process.exitCode = 1;
    return;
  }

  console.log('[ServicePolicyGate] Policy review gate passed.');
};

main();
