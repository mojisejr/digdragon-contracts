import { ethers, run } from "hardhat";

import fs from "fs";

async function deploy() {
  const tokenFac = await ethers.getContractFactory("DracaToken");

  const token = await tokenFac.deploy();
  await token.deployed();

  console.log("NFT verifying =>  ", token.address);
  await run("verify:verify", {
    address: token.address,
    contract: "contracts/Digdragon-mine/DracaToken.sol:DracaToken",
  });

  console.log({
    token: token.address,
  });

  fs.writeFileSync(
    "draca_token.json",
    JSON.stringify({
      token: token.address,
    })
  );
}

async function main() {
  await deploy();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
