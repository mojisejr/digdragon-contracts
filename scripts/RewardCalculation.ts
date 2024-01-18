import { ethers } from "hardhat";
import fs from "fs";
import dayjs from "dayjs";

//Setting
const totalRewardToSpendInEther = 0.0035;
const stakingPeriodInDays = 13;
// const startTime = 1705323600;
const startTime = 1705496400;

const blockTime = 5;
const dayInSecs = 86400;
const dayBlocks = dayInSecs / blockTime;
const monthBlocks = dayBlocks * 30;
const yearBlocks = monthBlocks * 12;
const rewardPerDay = totalRewardToSpendInEther / stakingPeriodInDays;
const rewardPerBlock = rewardPerDay / dayBlocks;

function calculateDestinationBlocks(period: number, currentBlock: string) {
  console.log(dayBlocks);
  return period * dayBlocks + +currentBlock;
}

function calculateStartBlock(currentBlock: string) {
  const hourToStart = dayjs(startTime * 1000).diff(new Date(), "h");
  const blockPerHour = 3600 / blockTime;
  const blockToBeSkipped = hourToStart * blockPerHour;
  return { blockToBeSkipped, startBlock: +currentBlock + blockToBeSkipped };
}

export async function calculateRewardParameters() {
  const [owner] = await ethers.getSigners();
  const currentBlock = await ethers.provider.getBlockNumber();
  const parsedRewardPerBlock = ethers.utils.parseEther(
    rewardPerBlock.toFixed(18).toString()
  );

  const { blockToBeSkipped, startBlock } = calculateStartBlock(
    currentBlock.toString()
  );

  const destinationBlock = calculateDestinationBlocks(
    stakingPeriodInDays,
    startBlock.toString()
  );

  const daysBeforeStarts = (startBlock - currentBlock) / dayBlocks;

  console.log({
    totalRewardToSpendInEther,
    daysBeforeStarts,
    startTime: dayjs(new Date(startTime * 1000)).format("YYYY-MM-DDTHH:mm"),
    startBlock,
    endTime: dayjs(new Date(startTime * 1000))
      .add(30, "d")
      .format("YYYY-MM-DDTHH:mm"),
    endBlock: destinationBlock,
    rewardPerBlock: rewardPerBlock.toFixed(18),
    parsedRewardPerBlock: parsedRewardPerBlock.toString(),
  });
}

async function main() {
  await calculateRewardParameters();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
