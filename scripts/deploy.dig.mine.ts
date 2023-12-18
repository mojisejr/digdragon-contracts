import { ethers } from "hardhat";
import fs from "fs";
import csvtojson from "csvtojson";
import { cwd } from "process";

async function deploy() {
  const [owner] = await ethers.getSigners();
  const nftFact = await ethers.getContractFactory("NFT");
  const mineFact = await ethers.getContractFactory("DigDragonMine");
  const rewardFact = await ethers.getContractFactory("Reward");
  const hashStorageFact = await ethers.getContractFactory(
    "DigDragonPowerStorage"
  );

  let hashpower = await csvtojson().fromFile(`${cwd()}/scripts/hashpower.csv`);
  hashpower = hashpower.map((m) => m.hashpower);
  let uri = await csvtojson().fromFile(`${cwd()}/scripts/out.csv`);
  uri = uri.map((m) => m.uri);
  const tokenIds = Array.from({ length: 200 }, (_, i) => i + 1);

  // const startBlock = 13860319;
  // const endBlock = startBlock + 10000000;
  // const rewardPerBlock = 1000;

  const nft = await nftFact.deploy();
  await nft.deployed();

  await nft.setBaseUri(tokenIds, uri);

  // // const reward = await rewardFact.deploy();
  // // await reward.deployed();

  const hashPowerStorage = await hashStorageFact.deploy(tokenIds, hashpower);
  await hashPowerStorage.deployed();

  // // const mine = await mineFact.deploy(
  // //   nft.address,
  // //   reward.address,
  // //   hashPowerStorage.address,
  // //   owner.address,
  // //   startBlock,
  // //   rewardPerBlock,
  // //   endBlock
  // // );

  // // await mine.deployed();

  // // await reward.transfer(mine.address, reward.totalSupply());
  // // await reward.transfer(owner.address, reward.totalSupply());

  console.log({
    nft: nft.address,
    // reward: reward.address,
    hashPowerStorage: hashPowerStorage.address,
    // mine: mine.address,
  });

  fs.writeFileSync(
    "address.json",
    JSON.stringify({
      nft: nft.address,
      // reward: reward.address,
      hashPowerStorage: hashPowerStorage.address,
      // mine: mine.address,
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
