import { expect } from "chai";
import { ethers } from "hardhat";
import { mine as Mine, time } from "@nomicfoundation/hardhat-network-helpers";
import csvtojson from "csvtojson";
import { cwd } from "process";

describe("Digdragon mining Test", () => {
  async function deploy() {
    const [owner, acc1, acc2] = await ethers.getSigners();
    const nftFact = await ethers.getContractFactory("NFT");
    const mineFact = await ethers.getContractFactory("DigDragonMineV2");
    const rewardFact = await ethers.getContractFactory("Reward");
    const hashStorageFact = await ethers.getContractFactory(
      "DigDragonPowerStorage"
    );
    const startBlock = (await time.latestBlock()) + 100;
    console.log("start block @ ", startBlock);
    const endBlock = startBlock + 1000;
    const rewardPerBlock = 1000;
    const nft = await nftFact.deploy();
    await nft.deployed();

    await nft.addWhitelist(
      [owner.address, acc1.address, acc2.address],
      [10, 10, 10]
    );

    let hashpower = await csvtojson().fromFile(
      `${cwd()}/scripts/hashpower.csv`
    );
    hashpower = hashpower.map((m) => m.hashpower);
    let uri = await csvtojson().fromFile(`${cwd()}/scripts/out.csv`);
    uri = uri.map((m) => m.uri);
    const tokenIds = Array.from({ length: 200 }, (_, i) => i + 1);

    const reward = await rewardFact.deploy();
    await reward.deployed();

    const hashPowerStorage = await hashStorageFact.deploy(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [10000, 10000, 10000, 15000, 20000, 30000, 10000, 20000, 15000, 10000]
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
    await mine.setPause(false);

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

  it("1. 1 person stake for 10,000 for 100 blocks", async () => {
    const { owner, acc1, nft, mine, reward } = await deploy();
    const startTime = await time.latestBlock();
    console.log("start test @: ", startTime);
    console.log("set approval for all + 1 block");
    await nft.connect(acc1).setApprovalForAll(mine.address, true);

    console.log("stake + 1 block");
    await mine.connect(acc1).stake([2]);
    console.log("stake block @ ", await time.latestBlock());

    console.log("mine for + 100 blocks");
    await Mine(200);
    console.log("new @ ", await time.latestBlock());

    const pending = await mine.pendingReward(acc1.address);
    console.log("calculate reward + 0 blocks");
    console.log("reward @ ", await time.latestBlock());
    console.log("before unstake = ", pending.toString());

    console.log("withdraw reward without unstaking + 1 blocks");
    console.log(
      "we have to add 1 block reward to see the actual reward witdrawn",
      +pending + 1000
    );
    // await mine.connect(acc1).earnReward();
    await mine.connect(acc1).unstake([2]);

    console.log("now @ ", await time.latestBlock());
    const balance = await reward.balanceOf(acc1.address);
    const ownerBalance = await reward.balanceOf(owner.address);
    console.log("balance of A = ", balance.toString());
    console.log("balance of feeCollector = ", ownerBalance.toString());
    const lastpending = await mine.pendingReward(acc1.address);
    console.log("after unstake = ", lastpending.toString());
    // const userInfo = await mine.getUserInfo(acc1.address);
    // console.log({ lastpending, userInfo });
  });

  // it("2. person with same hashpower start at the same time unstake at the same time", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);
  //   console.log("+ 3 blocks @", await time.latestBlock());

  //   await mine.connect(acc1).stake([2]);
  //   await mine.connect(acc2).stake([3]);
  //   console.log("+ 2 blocks @", await time.latestBlock());

  //   await Mine(100);
  //   console.log("+ 100 blocks @", await time.latestBlock());

  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   const acc2Pending = await mine.pendingReward(acc2.address);

  //   console.log("acc1 pending @ -2 blocks", acc1Pending);
  //   console.log("acc2 pending @ -2 blocks", acc2Pending);

  //   await mine.connect(acc1).earnReward();
  //   await mine.connect(acc2).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("acc2 reawrd = ", await reward.balanceOf(acc2.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });

  // it("3. person with different hashpower start at the same time unstake at the same time", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);
  //   console.log("+ 3 blocks @", await time.latestBlock());

  //   await mine.connect(acc1).stake([2, 5]);
  //   await mine.connect(acc2).stake([3]);
  //   console.log("+ 2 blocks @", await time.latestBlock());

  //   await Mine(100);
  //   console.log("+ 100 blocks @", await time.latestBlock());

  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   const acc2Pending = await mine.pendingReward(acc2.address);

  //   console.log("acc1 pending @ -2 blocks", acc1Pending);
  //   console.log("acc2 pending @ -2 blocks", acc2Pending);

  //   await mine.connect(acc1).earnReward();
  //   await mine.connect(acc2).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("acc2 reawrd = ", await reward.balanceOf(acc2.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });
  // it("4. person with same hashpower start at the same time  acc1 unstake at 100 acc2 unstake at 200", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);
  //   console.log("+ 3 blocks @", await time.latestBlock());

  //   await mine.connect(acc1).stake([2]);
  //   await mine.connect(acc2).stake([3]);
  //   console.log("+ 2 blocks @", await time.latestBlock());

  //   await Mine(100);
  //   console.log("+ 100 blocks acc1 unstake @", await time.latestBlock());
  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   console.log("acc1 pending @ -1 blocks", acc1Pending);
  //   await mine.connect(acc1).earnReward();

  //   await Mine(100);
  //   console.log("+ 100 blocks acc2 unstake @", await time.latestBlock());
  //   const acc2Pending = await mine.pendingReward(acc2.address);
  //   console.log("acc2 pending @ -1 blocks", acc2Pending);
  //   await mine.connect(acc2).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("acc2 reawrd = ", await reward.balanceOf(acc2.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });

  // it("5. person with different hashpower start at the same time  acc1 unstake at 100 acc2 unstake at 200", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);
  //   console.log("+ 3 blocks @", await time.latestBlock());

  //   await mine.connect(acc1).stake([2, 5]);
  //   await mine.connect(acc2).stake([3]);
  //   console.log("+ 2 blocks @", await time.latestBlock());

  //   await Mine(100);
  //   console.log("+ 100 blocks acc1 unstake @", await time.latestBlock());
  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   console.log("acc1 pending @ -1 blocks", acc1Pending);
  //   await mine.connect(acc1).earnReward();

  //   await Mine(100);
  //   console.log("+ 100 blocks acc2 unstake @", await time.latestBlock());
  //   const acc2Pending = await mine.pendingReward(acc2.address);
  //   console.log("acc2 pending @ -1 blocks", acc2Pending);
  //   await mine.connect(acc2).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("acc2 reawrd = ", await reward.balanceOf(acc2.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });

  // it("6. acc1 stake at first 100 block within 50 block acc2 enter with same hashpower and unstake at the sametime", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);
  //   console.log("+ 3 blocks @", await time.latestBlock());

  //   await mine.connect(acc1).stake([2]);
  //   await Mine(50);
  //   console.log("after +50 @", await time.latestBlock());
  //   await mine.connect(acc2).stake([3]);

  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   console.log("acc1 pending @  blocks", acc1Pending);
  //   await mine.connect(acc1).earnReward();

  //   const acc2Pending = await mine.pendingReward(acc2.address);
  //   console.log("acc2 pending @  blocks", acc2Pending);
  //   await mine.connect(acc2).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("acc2 reawrd = ", await reward.balanceOf(acc2.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });

  // it("7. acc1 stake at first 100 block within 50 block acc2 enter with same hashpower and unstake at the sametime", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());
  //   console.log("stake n earn suddenly");

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);

  //   await mine.connect(acc1).stake([2]);
  //   await Mine(2);
  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   console.log("acc1 pending @  blocks", acc1Pending);
  //   await mine.connect(acc1).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));
  // });

  // it("8. acc1 stake at first 100 block and unstake check the reward after that", async () => {
  //   const { owner, acc1, acc2, mine, reward, nft } = await deploy();

  //   console.log("start @ ", await time.latestBlock());

  //   await nft.setApprovalForAll(mine.address, true);
  //   await nft.connect(acc1).setApprovalForAll(mine.address, true);
  //   await nft.connect(acc2).setApprovalForAll(mine.address, true);

  //   await mine.connect(acc1).stake([2]);
  //   await Mine(100);
  //   console.log("after +100 @", await time.latestBlock());
  //   await mine.connect(acc1).stake([5]);
  //   await Mine(100);
  //   console.log("after +100 @", await time.latestBlock());

  //   // await mine.connect(acc1).unstake([2, 5]);
  //   await mine.connect(acc1).earnReward();

  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   // console.log("acc1 pending = ", acc1Pending);
  //   await mine.connect(acc1).earnReward();
  //   const acc1Pending = await mine.pendingReward(acc1.address);
  //   console.log("acc1 pending = ", acc1Pending);
  //   console.log("acc1 reawrd = ", await reward.balanceOf(acc1.address));
  //   console.log("fee = ", await reward.balanceOf(owner.address));

  //   const info = await mine.getMineInfo();
  //   console.log(info);
  // });
});
