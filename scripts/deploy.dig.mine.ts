import { ethers } from "hardhat";
import fs from "fs";

async function deploy() {
  const [owner] = await ethers.getSigners();
  const nftFact = await ethers.getContractFactory("NFT");
  const mineFact = await ethers.getContractFactory("DigDragonMine");
  const rewardFact = await ethers.getContractFactory("Reward");
  const hashStorageFact = await ethers.getContractFactory("HashPowerStorage");

  const startBlock = 13860319n;
  const endBlock = startBlock + 10000000n;
  const rewardPerBlock = 1000;

  const nft = await nftFact.deploy();
  await nft.deployed();

  const reward = await rewardFact.deploy();
  await reward.deployed();

  const hashPowerStorage = await hashStorageFact.deploy(
    nft.address,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    [
      50n,
      20n,
      30n,
      40n,
      80n,
      80n,
      20n,
      60n,
      30n,
      70n,
      50n,
      20n,
      30n,
      40n,
      80n,
      80n,
      20n,
      60n,
      30n,
      70n,
    ]
  );
  await hashPowerStorage.deployed();

  const mine = await mineFact.deploy(
    nft.address,
    reward.address,
    hashPowerStorage.address,
    startBlock,
    rewardPerBlock,
    endBlock
  );

  await mine.deployed();

  await reward.transfer(mine.address, reward.totalSupply());

  console.log({
    nft: nft.address,
    reward: reward.address,
    hashPowerStorage: hashPowerStorage.address,
    mine: mine.address,
  });

  fs.writeFileSync(
    "address.json",
    JSON.stringify({
      nft: nft.address,
      reward: reward.address,
      hashPowerStorage: hashPowerStorage.address,
      mine: mine.address,
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
