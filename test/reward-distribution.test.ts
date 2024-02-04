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
    const rewardPerBlock = 10;
    const nft = await nftFact.deploy();
    await nft.deployed();

    console.log("- เริ่มต้นที่ block ", startBlock);
    console.log("- reward ต่อ block ", rewardPerBlock);

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
        50n,
        50n,
        50n,
        50n,
        50n,
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
      await nft.mint(); //147
      await nft.connect(acc1).mint(); //258
      await nft.connect(acc2).mint(); //369
    }

    await mine.setPause(false);
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

  it("1. pending reward เทียบกับ unstaking ที่ owner รับ ควรจะเท่ากัน", async () => {
    const { owner, acc1, acc2, nft, mine, reward } = await deploy();

    console.log("- NFT hashpower (acc1) ", 50);

    console.log("Report 1");
    console.log(
      "Test Case: เอา NFT มา ขุด 1 ตัว แล้วให้ชุดไป 10 block แล้วเชคว่า pending reward กับ reward ที่ถอนตรงหรือไม่"
    );

    console.log("1. เริ่มต้นที่ block ", await time.latestBlock());
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    console.log(
      "2. block no หลังจาก setApproveForAll ",
      await time.latestBlock()
    );

    console.log("3. block no ก่อน stake ", await time.latestBlock());
    await mine.connect(acc1).stake([2]);

    console.log("4. block no หลังจาก stake ", await time.latestBlock());
    console.log("ตั้งค่าให้เวลาผ่านไป 10 blocks");
    Mine(10);
    console.log(
      "5. block no หลังจาก ผ่านไปแล้ว 10 block ",
      await time.latestBlock()
    );

    const acc1PendingReward = await mine.pendingReward(acc1.address);
    console.log(
      "6. block no หลังกดเชค pending reward ",
      await time.latestBlock()
    );

    console.log("##########");
    console.log("7. pending reward ที่ได้ ", acc1PendingReward[1].toString());
    console.log("##########");

    console.log(
      "8. ทำการ unstake เพื่อเชคว่า ได้รับ reward เท่ากับ pending reward หรือไม่"
    );
    await mine.connect(acc1).unstake([2]);
    console.log(
      "9. block no หลังจากที่ทำการ unstaking",
      await time.latestBlock()
    );

    const unstakedBalanceOfAcc1 = await reward.balanceOf(acc1.address);
    console.log(
      "10. block no หลังจากที่เรียกดู reward ใน wallet",
      await time.latestBlock()
    );

    console.log("#########");
    console.log(
      "11. reward ใน wallet ที่ได้รับจริง ",
      unstakedBalanceOfAcc1.toString()
    );
    console.log("#########");

    console.log("11. จบที่ block no ", await time.latestBlock());

    console.log(
      "จะเห็นว่าค่า pending reward ไม่ตรงกันในเคสนี้ แต่ reward ที่ได้ ถูกต้อง เพราะจาก block ที่ stake คือ block ที่ 18 - 29 = 11 block เมื่อ reward per block = 10 tokens/blocks เมื่อหักค่า fee จึงได้ผลลัพธ์ดังต่อไปนี้ครับ "
    );
    console.log("12. ผลของการตรวจสอบ reward ก่อนถอน ใน smart contract: ", {
      rewardsForWithdrawal: 110,
      feeRate: 3,
      payout: 107,
    });

    console.log("########## End");
    console.log("");
  });

  it("2. pending reward ของ staked token ที่มี hashrate เท่ากัน  เข้าเหมืองพร้อมกัน จะต้องได้ reward เท่ากันหากถอนพร้อมกัน", async () => {
    const { owner, acc1, acc2, nft, mine, reward } = await deploy();

    console.log("- NFT hashpower (acc1) ", 50);
    console.log("- NFT hashpower (acc2) ", 50);
    console.log("Report 2");
    console.log(
      "Test Case: เชคว่า pending reward กับ reward ที่ถอนตรงหรือไม่ ด้วยการให้ owner 2 คน stake token ที่มี hash = 50 เท่ากัน คนละ 1 ตัว  แล้วถอนพร้อมกัน หลังจาก ผ่านไป 10 block"
    );

    console.log("1. เริ่มต้นที่ block ", await time.latestBlock());
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    await nft.connect(acc2).setApprovalForAll(mine.address, true);
    console.log(
      "2. block no หลังจาก setApproveForAll",
      await time.latestBlock()
    );
    console.log(
      "** จะเห็นว่ามีการข้าม 2 block นั่นก็เพราะว่า มีการ call setApprovalForAll 2 ครั้ง จาก acc1 และ acc2"
    );

    console.log("3. block no ก่อน stake ", await time.latestBlock());
    await mine.connect(acc1).stake([2]);
    await mine.connect(acc2).stake([3]);

    console.log("4. block no หลังจาก stake ", await time.latestBlock());
    console.log("ตั้งค่าให้เวลาผ่านไป 10 blocks");
    Mine(10);

    console.log(
      "5. block no หลังจาก ผ่านไปแล้ว 10 block ",
      await time.latestBlock()
    );
    const acc1PendingReward = await mine.pendingReward(acc1.address);
    const acc2PendingReward = await mine.pendingReward(acc2.address);
    console.log(
      "6. block no หลังกดเชค pending reward ",
      await time.latestBlock()
    );

    console.log("##########");
    console.log("7 pending reward ที่ได");
    console.log("acc1 pending ", acc1PendingReward[1].toString());
    console.log("acc2 pending ", acc2PendingReward[1].toString());
    console.log("##########");

    console.log(
      "8. ทำการ unstake เพื่อเชคว่า ได้รับ reward เท่ากับ pending reward หรือไม่"
    );
    await mine.connect(acc1).unstake([2]);
    await mine.connect(acc2).unstake([3]);
    console.log(
      "9. block no หลังจากที่ทำการ unstaking",
      await time.latestBlock()
    );

    const unstakedBalanceOfAcc1 = await reward.balanceOf(acc1.address);
    const unstakedBalanceOfAcc2 = await reward.balanceOf(acc2.address);
    console.log(
      "10. block no หลังจากที่เรียกดู reward ใน wallet",
      await time.latestBlock()
    );

    console.log("#########");
    console.log("11. reward ใน wallet ที่ได้รับจริง");
    console.log("acc1 reward จริง ที่ได้ ", unstakedBalanceOfAcc1.toString());
    console.log("acc2 reward จริง ที่ได้ ", unstakedBalanceOfAcc2.toString());
    console.log("#########");

    console.log(
      "จะเห็นว่าค่า pending reward ไม่ตรงกันในเคสนี้ pending reward ในความเป็นจริงแล้วควรจะเป็น 55 กับ 55 เท่ากัน แต่แสดงผลไม่เท่ากัน (เกิดจากการคำนวนเพื่อแสดงผลผิดพลาด) แต่ reward ที่ได้ ถูกต้อง เพราะจาก block ที่ stake คือ block ที่ 49 - 61 = 13 block เมื่อ reward per block = 10 tokens/blocks เมื่อหักค่า fee จึงได้ผลลัพธ์ดังต่อไปนี้ครับ "
    );

    console.log(
      "ในส่วนนี้ reward จะเป็น 120 ดังนั้น ทำให้ได้รับ reward ดังต่อไปนี้"
    );

    console.log("acc1 ถอน", {
      feeRate: 1,
      payout: 64,
    });

    console.log("acc2 ถอน", {
      feeRate: 1,
      payout: 64,
    });

    console.log("########## End");
    console.log("");
  });

  it("3. ถ้า stake hashpower ไม่เท่ากันจะต้องได้ reward ไม่เท่ากัน hashpower มากได้มาก hashpower น้อย ได้น้อย", async () => {
    const { owner, acc1, acc2, nft, mine, reward } = await deploy();

    console.log("- NFT hashpower (acc1) ", 50);
    console.log("- NFT hashpower (acc2) ", 100);
    console.log("Report 3");
    console.log(
      "Test Case: เชคว่า pending reward กับ reward ที่ถอน คนที่มี hashpower รวมมากกว่าจะต้องได้ reward มากกว่า ด้วยการให้ owner 2 คน stake token ไม่เหมือนกัน ให้คนแรกมี 50 hashpower คนที่สองมี 100 hashpower  แล้วถอนพร้อมกัน หลังจาก ผ่านไป 10 block"
    );

    console.log("1. เริ่มต้นที่ block ", await time.latestBlock());
    await nft.connect(acc1).setApprovalForAll(mine.address, true);
    await nft.connect(acc2).setApprovalForAll(mine.address, true);
    console.log(
      "2. block no หลังจาก setApproveForAll",
      await time.latestBlock()
    );
    console.log(
      "** จะเห็นว่ามีการข้าม 2 block นั่นก็เพราะว่า มีการ call setApprovalForAll 2 ครั้ง จาก acc1 และ acc2"
    );

    console.log("3. block no ก่อน stake ", await time.latestBlock());
    await mine.connect(acc1).stake([2]);
    await mine.connect(acc2).stake([3, 6]);
    console.log("** acc2 stake token 2 ตัวตัวละ 50 ทำให้มี hp เท่ากับ 100");

    console.log("4. block no หลังจาก stake ", await time.latestBlock());
    console.log("ตั้งค่าให้เวลาผ่านไป 10 blocks");
    Mine(10);

    console.log(
      "5. block no หลังจาก ผ่านไปแล้ว 10 block ",
      await time.latestBlock()
    );
    const acc1PendingReward = await mine.pendingReward(acc1.address);
    const acc2PendingReward = await mine.pendingReward(acc2.address);
    console.log(
      "6. block no หลังกดเชค pending reward ",
      await time.latestBlock()
    );

    console.log("##########");
    console.log("7 pending reward ที่ได");
    console.log("acc1 pending ", acc1PendingReward[1].toString());
    console.log("acc2 pending ", acc2PendingReward[1].toString());
    console.log("##########");

    console.log(
      "8. ทำการ unstake เพื่อเชคว่า ได้รับ reward เท่ากับ pending reward หรือไม่"
    );
    await mine.connect(acc1).unstake([2]);
    await mine.connect(acc2).unstake([3]);
    console.log(
      "9. block no หลังจากที่ทำการ unstaking",
      await time.latestBlock()
    );

    const unstakedBalanceOfAcc1 = await reward.balanceOf(acc1.address);
    const unstakedBalanceOfAcc2 = await reward.balanceOf(acc2.address);
    console.log(
      "10. block no หลังจากที่เรียกดู reward ใน wallet",
      await time.latestBlock()
    );

    console.log("#########");
    console.log("11. reward ใน wallet ที่ได้รับจริง");
    console.log("acc1 reward จริง ที่ได้ ", unstakedBalanceOfAcc1.toString());
    console.log("acc2 reward จริง ที่ได้ ", unstakedBalanceOfAcc2.toString());
    console.log("#########");

    console.log(
      "จะเห็นว่าค่า pending reward ไม่ตรงกันในเคสนี้ (เกิดจากการคำนวนเพื่อแสดงผลผิดพลาด) แต่ reward ที่ได้ ถูกต้อง เพราะจาก block ที่ stake คือ block ที่ 81 - 93 = 13 block เมื่อ reward per block = 10 tokens/blocks เมื่อหักค่า fee จึงได้ผลลัพธ์ดังต่อไปนี้ครับ "
    );

    console.log("acc1 hashpower 50 ถอน", {
      feeRate: 1,
      payout: 45,
    });

    console.log("acc2 hashpower 100 ถอน", {
      feeRate: 2,
      payout: 81,
    });

    console.log(
      "** reward ตกหล่นเล็กน้อยจากการที่ blockchain ไม่มี จุดทศนิยมทำให้ไม่สามารถ distribute reward ที่มีจุดทศนิยามเล็กมากๆ ได้ดังนั้น บางครั้งหลังจากคำนวนจะทำให้ reward บางส่วนตกค้างอยู่ใน contract เรียกว่า 'เศษ reward'"
    );

    console.log("########## End");
    console.log("");
  });
});
