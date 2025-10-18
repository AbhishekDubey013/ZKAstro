import { generateZKProof, verifyZKProof } from './lib/zkproof/poseidon-proof';

async function testZKVerification() {
  console.log("=== TESTING ZK PROOF VERIFICATION ===\n");

  const birthData = {
    dob: "1990-01-15",
    tob: "14:30",
    tz: "America/New_York",
    lat: 40.7128,
    lon: -74.0060
  };

  const positions = {
    planets: { sun: 24500, moon: 8765, mercury: 18234, venus: 21098, mars: 9876, jupiter: 12345, saturn: 30000 },
    asc: 15000,
    mc: 20000
  };

  console.log("📊 Test Data: 1990-01-15 14:30 (New York)\n");

  // Test 1: Valid proof
  console.log("🧪 TEST 1: Valid Proof Should Pass");
  const validProof = await generateZKProof(birthData, positions);
  const validResult = await verifyZKProof(validProof.commitment, validProof.proof, validProof.nonce, positions);
  console.log(`  Result: ${validResult ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Test 2: Tampered proof
  console.log("🧪 TEST 2: Tampered Proof Should Fail");
  const tamperedProof = "0" + validProof.proof.substring(1);
  const tamperedResult = await verifyZKProof(validProof.commitment, tamperedProof, validProof.nonce, positions);
  console.log(`  Result: ${!tamperedResult ? '✅ PASSED (rejected)' : '❌ FAILED (accepted!)'}\n`);

  // Test 3: Wrong positions
  console.log("🧪 TEST 3: Wrong Positions Should Fail");
  const wrongPositions = { ...positions, planets: { ...positions.planets, sun: 99999 } };
  const wrongPosResult = await verifyZKProof(validProof.commitment, validProof.proof, validProof.nonce, wrongPositions);
  console.log(`  Result: ${!wrongPosResult ? '✅ PASSED (rejected)' : '❌ FAILED (accepted!)'}\n`);

  // Test 4: Wrong nonce
  console.log("🧪 TEST 4: Wrong Nonce Should Fail");
  const wrongNonce = "00".repeat(32);
  const wrongNonceResult = await verifyZKProof(validProof.commitment, validProof.proof, wrongNonce, positions);
  console.log(`  Result: ${!wrongNonceResult ? '✅ PASSED (rejected)' : '❌ FAILED (accepted!)'}\n`);

  const allPassed = validResult && !tamperedResult && !wrongPosResult && !wrongNonceResult;
  
  if (allPassed) {
    console.log("=== ALL TESTS PASSED ✅ ===");
    console.log("🔐 ZK Proof System is Cryptographically Sound!");
  } else {
    console.log("=== SOME TESTS FAILED ❌ ===");
    process.exit(1);
  }
}

testZKVerification().catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
