import {
  loadServiceEncapsulationPolicy,
  ServiceEncapsulationPolicyError,
} from './service-encapsulation-policy.mjs';

try {
  const { policySource } = loadServiceEncapsulationPolicy();
  console.log(`[ServicePolicy] Validation passed: ${policySource}`);
} catch (error) {
  console.error('[ServicePolicy] Validation failed:');
  if (error instanceof ServiceEncapsulationPolicyError) {
    for (const issue of error.issues ?? [error.message]) {
      console.error(`- ${issue}`);
    }
  } else {
    console.error(`- ${String(error)}`);
  }
  process.exitCode = 1;
}
