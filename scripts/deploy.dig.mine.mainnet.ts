import { ethers, run } from "hardhat";
import fs from "fs";
import csvtojson from "csvtojson";
import { cwd } from "process";

async function deploy() {
  const [owner] = await ethers.getSigners();
  const nft = "0x7C80f994C724b0C8F834F4303C4f142004798219";
  const reward = "0x726613C4494C60B7dCdeA5BE2846180C1DAfBE8B";
  const feeCollector = "0x1265AF05ce0b5b2fFEd3E9F3c45D47fe3Dc7B5B2";
  const mineFact = await ethers.getContractFactory("DigDragonMine");
  const hashStorageFact = await ethers.getContractFactory(
    "DigDragonPowerStorage"
  );

  const startBlock = 16833339;
  const endBlock = 17351739;
  const rewardPerBlock = 6751543210;

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
    constructorArguments: [tokenIds, hashpower],
  });

  console.log("DigDragonMine verifying =>  ", mine.address);
  await run("verify:verify", {
    address: mine.address,
    contract: "contracts/Digdragon-mine/DigMine.sol:DigDragonMine",
    constructorArguments: [
      nft,
      reward,
      hashPowerStorage.address,
      feeCollector,
      startBlock,
      rewardPerBlock,
      endBlock,
    ],
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

// {
//   nft: '0x7C80f994C724b0C8F834F4303C4f142004798219',
//   reward: '0x726613C4494C60B7dCdeA5BE2846180C1DAfBE8B',
//   hashPowerStorage: '0xa899906616f7Ee6DCB19740AC746839476ebd98E',
//   mine: '0xD83b57C947dfF915fd6969612faaf2059dD8a026'
// }
