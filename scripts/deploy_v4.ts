import { ethers } from "hardhat";

async function deploy() {
  const [owner] = await ethers.getSigners();
  const fac = await ethers.getContractFactory("JaothuiCertKAP721");

  const _kyc = "0x2c8abd9c61d4e973ca8db5545c54c90e44a2445c";
  const _adminProjectRouter = "0xe4088e1f199287b1146832352ae5fc3726171d41";
  const _committee = "0x5bcdfb971d6622eef0bfcaf7ecb6120a822b1cd3";
  const _transferRouter = "0xd46eee53a8bf341b72fbc47b449090e6b7ded433";
  const _acceptedKYCLevel = 4;

  const nft = await fac.deploy(
    _kyc,
    _adminProjectRouter,
    _committee,
    _transferRouter,
    _acceptedKYCLevel
  );
  await nft.deployed();

  console.log("deployed: ", { nft: nft.address });
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
