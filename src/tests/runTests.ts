import { runDomainVerificationTests } from './domainOperations.test';
import { runWebMcpVerificationTests } from './webmcpTools.test';

async function main() {
  console.log('🚀 Running Domain Operations Verification Suite...');
  const domainRes = runDomainVerificationTests();
  domainRes.results.forEach((r) => console.log(r));

  console.log('\n🌐 Running WebMCP Integration Verification Suite...');
  const webmcpRes = await runWebMcpVerificationTests();
  webmcpRes.results.forEach((r) => console.log(r));

  const totalPassed = domainRes.passed + webmcpRes.passed;
  const totalFailed = domainRes.failed + webmcpRes.failed;

  console.log(`\n========================================`);
  console.log(`Total Tests Completed: ${totalPassed + totalFailed} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log(`========================================`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
