import { runDomainVerificationTests } from './domainOperations.test';

console.log('🚀 Running Domain Operations Verification Suite...');
const { passed, failed, results } = runDomainVerificationTests();

results.forEach(r => console.log(r));

console.log(`\n========================================`);
console.log(`Tests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
