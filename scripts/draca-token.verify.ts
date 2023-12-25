import { run } from "hardhat";

async function main() {
  const token = "";

  // verify Contracts
  console.log("NFT verifying =>  ", token);
  await run("verify:verify", {
    address: token,
    contract: "contracts/Digdragon-mine/DracaToken.sol:DracaToken",
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
