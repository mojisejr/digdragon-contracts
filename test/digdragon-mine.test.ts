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
    const endBlock = startBlock + 100;
    const rewardPerBlock = 1000;
    const nft = await nftFact.deploy();
    await nft.deployed();

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

  it("1. Acc1 stake 1 token at the first time and stake another token in the next 10 blocks", async () => {
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
    await Mine(10);
    console.log("10 blocks passed");
    const endTime = await time.latestBlock();

    //4. stake another token
    await mine.stake([4]);

    //5. check balance of withdrawn because of stake new token
    const end = (await reward.balanceOf(owner.address)).toString();

    console.log("received reward: ", end);
    console.log("reward per block: ", 1000);
    console.log("10 blocks reward: ", 1000 * 10);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    expect((await nft.ownerOf(1)).toString()).equal(mine.address);
    expect((await reward.balanceOf(owner.address)).toString()).not.equal("0");
  });

  it("2. Acc1 stake 1 token at the first time and acc2 stake another token in the next 10 blocks with the same amount of hashpower", async () => {
    const { nft, mine, reward, owner, acc2, acc1 } = await deploy();
    const startTime = await time.latestBlock();
    console.log("startTime: ", startTime);

    //1. approve
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    await nft.connect(acc2).setApprovalForAll(mine.address, true);

    //2. stake
    await mine.connect(acc1).stake([2]);
    const start = (await reward.balanceOf(acc1.address)).toString();
    console.log("reward at staking time: ", start);

    //3. mine 10 blocks
    await Mine(10);
    console.log("10 blocks passed");
    const endTime = await time.latestBlock();

    //4. stake another token
    await mine.connect(acc2).stake([6]);

    //5. check balance of withdrawn because of stake new token
    const acc1Bal = (await reward.balanceOf(acc1.address)).toString();
    const acc2Bal = (await reward.balanceOf(acc2.address)).toString();

    console.log("acc1 received reward: ", acc1Bal);
    console.log("acc2 received reward: ", acc2Bal);
    console.log("reward per block: ", 1000);
    console.log("10 blocks reward: ", 1000 * 10);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    expect((await nft.ownerOf(6)).toString()).equal(mine.address);
    expect((await reward.balanceOf(acc1.address)).toString()).equal("0");
    expect((await reward.balanceOf(acc2.address)).toString()).equal("0");
  });

  it("3. Acc1 stake 1 token at the first time and acc2 stake another token in the next 10 blocks with the same amount of hashpower unstake all at the same time", async () => {
    const { nft, mine, reward, owner, acc2, acc1 } = await deploy();
    const startTime = await time.latestBlock();
    console.log("startTime: ", startTime);

    //1. approve
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    await nft.connect(owner).setApprovalForAll(mine.address, true);

    //2. stake
    await mine.connect(acc1).stake([2]);
    await mine.connect(owner).stake([7]);
    const start = (await reward.balanceOf(acc1.address)).toString();
    console.log("reward at staking time: ", start);

    await Mine(10);
    const endTime = await time.latestBlock();
    await mine.connect(acc1).unstake([2]);
    await mine.connect(owner).unstake([7]);

    //5. check balance of withdrawn because of stake new token
    const acc1Bal = (await reward.balanceOf(acc1.address)).toString();
    const acc2Bal = (await reward.balanceOf(owner.address)).toString();

    console.log("acc1 received reward: ", acc1Bal);
    console.log("acc2 received reward: ", acc2Bal);
    console.log("reward per block: ", 1000);
    console.log("10 blocks reward: ", 1000 * 10);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    // expect((await nft.ownerOf(6)).toString()).equal(acc2.address);
    // expect((await reward.balanceOf(acc1.address)).toString()).equal("3200");
    // expect((await reward.balanceOf(acc2.address)).toString()).equal("9800");
  });

  it("4. Acc1 stake 1 token at the first time and acc2 stake another token and acc3 also staked 1 token in the next 10 blocks with the same amount of hashpower unstake all at the same time except acc3", async () => {
    const { nft, mine, reward, owner, acc2, acc1 } = await deploy();
    const startTime = await time.latestBlock();
    console.log("startTime: ", startTime);

    //1. approve
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    await nft.connect(acc2).setApprovalForAll(mine.address, true);
    await nft.connect(owner).setApprovalForAll(mine.address, true);

    //2. stake
    await mine.connect(acc1).stake([2]);
    await mine.connect(acc2).stake([3]);
    await mine.connect(owner).stake([7]);
    const start = (await reward.balanceOf(acc1.address)).toString();
    console.log("reward at staking time: ", start);

    await Mine(10);
    const endTime = await time.latestBlock();
    await mine.connect(acc1).unstake([2]);
    await mine.connect(owner).unstake([7]);

    //5. check balance of withdrawn because of stake new token
    const acc1Bal = (await reward.balanceOf(acc1.address)).toString();
    const acc2Bal = (await reward.balanceOf(owner.address)).toString();

    console.log("acc1 received reward: ", acc1Bal);
    console.log("acc2 received reward: ", acc2Bal);
    console.log("reward per block: ", 1000);
    console.log("10 blocks reward: ", 1000 * 10);
    console.log("actual block counts: ", endTime - 1);
    console.log("reward diff", endTime - startTime - 1);

    const pendingAcc1 = await mine.pendingReward(acc1.address);
    const pendingAcc2 = await mine.pendingReward(acc2.address);
    const pedningOwner = await mine.pendingReward(owner.address);

    Mine(10);

    const pendingAcc2_10 = await mine.pendingReward(acc2.address);

    console.log({
      pendingAcc1,
      pendingAcc2,
      pedningOwner,
      pendingAcc2_10,
    });

    const info = await mine.getMineInfo();
    console.log(info);

    expect((await nft.ownerOf(7)).toString()).equal(owner.address);
    // expect((await reward.balanceOf(acc1.address)).toString()).equal("6500");
    // expect((await reward.balanceOf(owner.address)).toString()).equal("6500");
  });

  it("should be able to change reward address", async () => {
    const { nft, mine, reward, owner, acc2, acc1 } = await deploy();

    const reward2Fac = await ethers.getContractFactory("Reward");

    const reward2 = await reward2Fac.deploy();

    await reward2.deployed();

    const info1 = await mine.getMineInfo();
    console.log(info1.reward);

    await mine.connect(owner).setRewardAddress(reward2.address);

    const info2 = await mine.getMineInfo();
    console.log(info2.reward);

    expect(reward2.address).to.equal(info2.reward);
  });
});
