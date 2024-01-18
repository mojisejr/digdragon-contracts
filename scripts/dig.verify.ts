import { run } from "hardhat";
import { cwd } from "process";
import csvtojson from "csvtojson";

async function main() {
  // const { nft, reward, hashPowerStorage, mine } = {
  //   nft: "0xB8049752965C248C53bdC9F747D69ca604a6F668",
  //   reward: "0xd8059280C036883a92331d4B05802fE38da2a434",
  //   hashPowerStorage: "0x5e254e90a5c4f5571499D1bB1Fd55913a5408773",
  //   mine: "0xDb06A56cF9EB8C02f678aE1a1D60609293b90688",
  // };

  let hashpower = await csvtojson().fromFile(`${cwd()}/scripts/hashpower.csv`);
  hashpower = hashpower.map((m) => m.hashpower);
  let uri = await csvtojson().fromFile(`${cwd()}/scripts/out.csv`);
  uri = uri.map((m) => m.uri);
  const tokenIds = Array.from({ length: 200 }, (_, i) => i + 1);

  const { nft, reward, hashPowerStorage, mine, feeCollector } = {
    nft: "0x7C80f994C724b0C8F834F4303C4f142004798219",
    reward: "0x726613C4494C60B7dCdeA5BE2846180C1DAfBE8B",
    hashPowerStorage: "0xa899906616f7Ee6DCB19740AC746839476ebd98E",
    mine: "0xD83b57C947dfF915fd6969612faaf2059dD8a026",
    feeCollector: "0x1265AF05ce0b5b2fFEd3E9F3c45D47fe3Dc7B5B2",
  };

  // verify Contracts
  // console.log("NFT verifying =>  ", nft);
  // await run("verify:verify", {
  //   address: nft,
  //   contract: "contracts/Digdragon-mine/nft.sol:NFT",
  // });

  // console.log("reward verifying => ", reward);
  // await run("verify:verify", {
  //   address: reward,
  //   contract: "contracts/Digdragon-mine/erc20.sol:Reward",
  // });

  console.log("hashPowerStorage verifying => ", hashPowerStorage);
  await run("verify:verify", {
    address: hashPowerStorage,
    contract: "contracts/Digdragon-mine/hashstorage.sol:DigDragonPowerStorage",
    constructorArguments: [tokenIds, hashpower],
  });

  const startBlock = 13860319n;
  const endBlock = startBlock + 10000000n;
  const rewardPerBlock = 1000;

  console.log("DigDragonMine verifying =>  ", mine);
  await run("verify:verify", {
    address: mine,
    contract: "contracts/Digdragon-mine/DigMine.sol:DigDragonMine",
    constructorArguments: [
      nft,
      reward,
      hashPowerStorage,
      feeCollector,
      startBlock,
      rewardPerBlock,
      endBlock,
    ],
  });
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
