import { ethers, run } from "hardhat";
import fs from "fs";
import csvtojson from "csvtojson";
import { cwd } from "process";

async function deploy() {
  const [owner] = await ethers.getSigners();
  const nft = "0x7C80f994C724b0C8F834F4303C4f142004798219";
  const reward = "0x726613C4494C60B7dCdeA5BE2846180C1DAfBE8B";
  const feeCollector = "";
  const mineFact = await ethers.getContractFactory("DigDragonMine");
  const hashStorageFact = await ethers.getContractFactory(
    "DigDragonPowerStorage"
  );

  const startBlock = 13860319;
  const endBlock = startBlock + 10000000;
  const rewardPerBlock = 1000;

  let hashpower = await csvtojson().fromFile(`${cwd()}/scripts/hashpower.csv`);
  hashpower = hashpower.map((m) => m.hashpower);
  let uri = await csvtojson().fromFile(`${cwd()}/scripts/out.csv`);
  uri = uri.map((m) => m.uri);
  const tokenIds = Array.from({ length: 200 }, (_, i) => i + 1);

  const hashPowerStorage = await hashStorageFact.deploy(tokenIds, hashpower);
  await hashPowerStorage.deployed();

  const mine = await mineFact.deploy(
    nft,
    reward,
    hashPowerStorage.address,
    feeCollector,
    startBlock,
    rewardPerBlock,
    endBlock
  );

  await mine.deployed();

  console.log({
    nft,
    reward,
    hashPowerStorage: hashPowerStorage.address,
    mine: mine.address,
  });

  console.log("HashPowerStorage verifying =>  ", hashPowerStorage.address);
  await run("verify:verify", {
    address: hashPowerStorage.address,
    contract: "contracts/Digdragon-mine/hashstorage.sol:DigDragonPowerStorage",
  });

  console.log("DigDragonMine verifying =>  ", mine.address);
  await run("verify:verify", {
    address: mine.address,
    contract: "contracts/Digdragon-mine/DigMine.sol:DigDragonMine",
  });
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
