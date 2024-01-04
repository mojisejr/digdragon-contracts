import { expect } from "chai";
import { ethers } from "hardhat";
import { mine as Mine, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Digdragon mining Test", () => {
  async function deploy() {
    const [owner, acc1, acc2] = await ethers.getSigners();
    const nftFact = await ethers.getContractFactory("NFT");
    const mineFact = await ethers.getContractFactory("DigDragonMine");
    const rewardFact = await ethers.getContractFactory("Reward");
    const hashStorageFact = await ethers.getContractFactory(
      "DigDragonPowerStorage"
    );
    const startBlock = await time.latestBlock();
    const endBlock = startBlock + 30;
    const rewardPerBlock = 100;
    const nft = await nftFact.deploy();
    await nft.deployed();

    console.log("deployed block", startBlock - 1);
    console.log("endblock", endBlock - 2);

    await nft.addWhitelist(
      [owner.address, acc1.address, acc2.address],
      [10, 10, 10]
    );

    const reward = await rewardFact.deploy();
    await reward.deployed();
    const hashPowerStorage = await hashStorageFact.deploy(
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
      owner.address,
      startBlock,
      rewardPerBlock,
      endBlock
    );
    await mine.deployed();
    await reward.transfer(mine.address, reward.totalSupply());
    // //mint 3 nft to each account
    for (let i = 0; i < 3; i++) {
      await nft.mint();
      await nft.connect(acc1).mint();
      await nft.connect(acc2).mint();
    }
    // console.log({
    //   nft: nft.address,
    //   reward: reward.address,
    //   hashPowerStorage: hashPowerStorage.address,
    //   mine: mine.address,
    // });
    return {
      owner,
      acc1,
      acc2,
      nft,
      reward,
      hashPowerStorage,
      mine,
    };
  }

  it("1. stake til end", async () => {
    const { nft, mine, reward, owner } = await deploy();
    const startTime = await time.latestBlock();
    console.log("startTime: ", startTime);

    //1. approve
    await nft.setApprovalForAll(mine.address, true);

    //2. stake
    await mine.stake([1]);
    const start = (await reward.balanceOf(owner.address)).toString();
    console.log("reward at staking time: ", start);

    //3. mine 10 blocks
    await Mine(20);
    console.log("20 blocks passed");
    const endTime = await time.latestBlock();

    //4. stake another token
    await mine.unstake([1]);

    //5. check balance of withdrawn because of stake new token
    const end = (await reward.balanceOf(owner.address)).toString();

    console.log("received reward: ", end);
    console.log("reward per block: ", 100);
    console.log("20 blocks reward: ", 100 * 20);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    expect((await nft.ownerOf(1)).toString()).equal(owner.address);
    expect((await reward.balanceOf(owner.address)).toString()).not.equal("0");
  });

  it("2. reset new staking period", async () => {
    const { nft, mine, reward, owner } = await deploy();

    const startTime = await time.latestBlock();
    console.log("startTime: ", startTime);

    //1. approve
    await nft.setApprovalForAll(mine.address, true);

    //2. stake
    await mine.stake([1]);
    const start = (await reward.balanceOf(owner.address)).toString();
    console.log("reward at staking time: ", start);

    //3. mine 10 blocks
    await Mine(20);
    console.log("20 blocks passed");
    const endTime = await time.latestBlock();

    const contractAPR = await mine.getAPRForContract();
    console.log("APR: ", contractAPR);

    //4. stake another token
    await mine.unstake([1]);

    const info2 = await mine.getMineInfo();
    console.log(info2);

    //5. check balance of withdrawn because of stake new token
    const end = (await reward.balanceOf(owner.address)).toString();

    console.log("received reward: ", end);
    console.log("reward per block: ", 100);
    console.log("20 blocks reward: ", 100 * 20);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    console.log("//=====");
    console.log("// new staking period");
    console.log("//=====");

    const startTime2 = await time.latestBlock();
    console.log("start time2: ", startTime2);
    const startBlock = (await time.latestBlock()) + 10;
    const endBlock = startBlock + 30;
    console.log("// new start block: ", startBlock);
    console.log("// new end block: ", endBlock);
    console.log("// diff", endBlock - startBlock);

    await mine.setStartBlock(startBlock);
    await mine.setRewardEndBlock(endBlock);

    console.log("//=====");
    console.log("// repeat staking");
    console.log("//=====");

    await mine.stake([1]);
    const start2 = (await reward.balanceOf(owner.address)).toString();
    console.log("reward at staking time: ", start2);

    //3. mine 10 blocks
    await Mine(20);
    console.log("20 blocks passed");
    const endTime2 = await time.latestBlock();

    //4. stake another token
    await mine.unstake([1]);

    //5. check balance of withdrawn because of stake new token
    const end2 = (await reward.balanceOf(owner.address)).toString();

    console.log("received reward: ", end2);
    console.log("reward per block: ", 100);
    console.log("20 blocks reward: ", 100 * 30);
    console.log("actual block counts: ", endTime2 - 1);
    console.log("reward diff", endTime2 - startTime2 - 1);

    expect((await nft.ownerOf(1)).toString()).equal(owner.address);
    expect((await reward.balanceOf(owner.address)).toString()).not.equal("0");
  });
});
