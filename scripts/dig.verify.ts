import { run } from "hardhat";

async function main() {
  // const { nft, reward, hashPowerStorage, mine } = {
  //   nft: "0xB8049752965C248C53bdC9F747D69ca604a6F668",
  //   reward: "0xd8059280C036883a92331d4B05802fE38da2a434",
  //   hashPowerStorage: "0x5e254e90a5c4f5571499D1bB1Fd55913a5408773",
  //   mine: "0xDb06A56cF9EB8C02f678aE1a1D60609293b90688",
  // };

  const { nft, reward, hashPowerStorage } = {
    nft: "0xAa7212479BD439912785099A98C8b8D411F199Fa",
    reward: "0x584D164cD421cf26C70Fa9926F658803F362C355",
    hashPowerStorage: "0x1AD3D989f2B6F770B20F08E56beCd9255Ee89044",
  };

  // verify Contracts
  console.log("NFT verifying =>  ", nft);
  await run("verify:verify", {
    address: nft,
    contract: "contracts/Digdragon-mine/nft.sol:NFT",
  });

  // console.log("reward verifying => ", reward);
  // await run("verify:verify", {
  //   address: reward,
  //   contract: "contracts/Digdragon-mine/erc20.sol:Reward",
  // });

  // console.log("hashPowerStorage verifying => ", hashPowerStorage);
  // await run("verify:verify", {
  //   address: hashPowerStorage,
  //   contract: "contracts/Digdragon-mine/hashstorage.sol:DigDragonPowerStorage",
  //   constructorArguments: [
  //     [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  //     [
  //       50n,
  //       20n,
  //       30n,
  //       40n,
  //       80n,
  //       80n,
  //       20n,
  //       60n,
  //       30n,
  //       70n,
  //       50n,
  //       20n,
  //       30n,
  //       40n,
  //       80n,
  //       80n,
  //       20n,
  //       60n,
  //       30n,
  //       70n,
  //     ],
  //   ],
  // });

  const startBlock = 13860319n;
  const endBlock = startBlock + 10000000n;
  const rewardPerBlock = 1000;

  // console.log("mine verifying => ", mine);
  // await run("verify:verify", {
  //   address: mine,
  //   contract: "contracts/Digdragon-mine/DigMine.sol:DigDragonMine",
  //   constructorArguments: [
  //     nft,
  //     reward,
  //     hashPowerStorage,
  //     startBlock,
  //     endBlock,
  //     rewardPerBlock,
  //   ],
  // });

  // console.log("Stimulus verifing =>  ", stimulus);
  // await run("verify:verify", {
  //   address: stimulus,
  //   contract: "contracts/Serum.v1.sol:SerumV1",
  // });

  // console.log("Labs verifying => ", labs);
  // await run("verify:verify", {
  //   address: labs,
  //   contract: "contracts/v2/FusionLabsV2.sol:FusionLabsV2",
  //   constructorArguments: [host, stimulus, mutant, 1000],
  // });
  //

  //   console.log("Mutant verifying => ", mutant);
  //   await run("verify:verify", {
  //     address: mutant,
  //     contract: "contracts/MutantOppabear.sol:OppaBearEvolutionGen2",
  //     constructorArguments: [owner, labs],
  //   }).catch((e) => console.error("gen2", e.message));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// host: "0x6E9f9ba6ABBe0Fb7E2f88Bd43e91a78949b4719c",
// stimulus: "0xb01fCF558c3EC204e21E303267669254d7eea4BC",
// labs: "0x5ADCDB93B38CB675EE31f07AbB8b07630b100480",
// mutant: "0xC5D459f6f219A73eB7e6087A344B9CbCd91d743C",
