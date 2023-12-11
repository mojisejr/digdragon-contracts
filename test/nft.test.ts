// import { expect } from "chai";
// import { ethers } from "hardhat";
// import data1 from "../mockup/1.json";
// import data2 from "../mockup/2.json";
// import data3 from "../mockup/3.json";

// const data = [data1, data2, data3];

// const certIpfs: string[] = [
//   "https://nftstorage.link/ipfs/bafkreibn4emze5bwa7gr3m3s6xldkbcjwv5rn4pfgeu2vvmwrbc5ouimui",
//   "https://nftstorage.link/ipfs/bafkreiftrowlsvtqwcnw243nzipyirwujwqxuk3wonz3s3mibxgkszyl54",
//   "https://nftstorage.link/ipfs/bafkreignvnstuoorxvkwmfyook5m2x2b2snt5ibtzvbu5ueu3yarpnwcia",
// ];

// const imageIpfs: string[] = [
//   "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
// ];

// const metadatas = [
//   {
//     name: "Bao Vee",
//     microchip: "972813475296584",
//     certNo: "11/15",
//     origin: "thai",
//     color: "pale pink",
//     imageUri: imageIpfs[0],
//     detail: "Detail",
//     sex: "female",
//     rarity: "N",
//     birthdate: 1476091200,
//     height: 145,
//     issuedAt: new Date().getTime(),
//   },
//   {
//     name: "Bao Bee",
//     microchip: "876549028765432",
//     certNo: "88/15",
//     origin: "laos",
//     color: "pink",
//     imageUri: imageIpfs[0],
//     detail: "detail of nothing",
//     sex: "male",
//     rarity: "R",
//     birthdate: 1476091200,
//     height: 165,
//     issuedAt: new Date().getTime(),
//   },
//   {
//     name: "Bao Cee",
//     microchip: "372594863091726",
//     certNo: "88/15",
//     origin: "laos",
//     color: "pink",
//     imageUri: imageIpfs[0],
//     detail: "detail of nothing",
//     sex: "male",
//     rarity: "R",
//     birthdate: 1476091200,
//     height: 165,
//     issuedAt: new Date().getTime(),
//   },
// ];

// const rewards = [
//   {
//     rewardUri: "ipfs1",
//     microchip: 972813475296584,
//   },
//   {
//     rewardUri: "ipfs2",
//     microchip: 876549028765432,
//   },
//   {
//     rewardUri: "ipfs3",
//     microchip: 372594863091726,
//   },
// ];

// describe("Certification Unit Test", async () => {
//   async function deploy() {
//     const jaothuiNFTFactory = await ethers.getContractFactory(
//       "JaothuiCertKAP721"
//     );
//     const metadataManager = await ethers.getContractFactory(
//       "JaothuiMetadataManagerV2"
//     );

//     const rewardManager = await ethers.getContractFactory(
//       "JaothuiRewardManager"
//     );

//     const historyManager = await ethers.getContractFactory(
//       "JaothuiHistoryManager"
//     );

//     const [thui, holder1, holder2, holder3] = await ethers.getSigners();

//     const _kyc = "0x2c8abd9c61d4e973ca8db5545c54c90e44a2445c";
//     const _adminProjectRouter = "0xe4088e1f199287b1146832352ae5fc3726171d41";
//     const _committee = "0x5bcdfb971d6622eef0bfcaf7ecb6120a822b1cd3";
//     const _transferRouter = "0xd46eee53a8bf341b72fbc47b449090e6b7ded433";
//     const _acceptedKYCLevel = 4;

//     //1. Deploy History Contract
//     const history = await historyManager.deploy();
//     await history.deployed();

//     //2. Deploy NFT
//     const jaothui = await jaothuiNFTFactory.deploy(
//       _kyc,
//       _adminProjectRouter,
//       _committee,
//       _transferRouter,
//       history.address,
//       _acceptedKYCLevel
//     );

//     await jaothui.deployed();

//     //3. Deploy Metadata
//     const metadata = await metadataManager.deploy(
//       jaothui.address,
//       history.address
//     );
//     await metadata.deployed();

//     //4. Deploy Reward
//     const reward = await rewardManager.deploy(jaothui.address, history.address);
//     await reward.deployed();

//     //6.Grant Role of other contract in order to save thier history
//     await history.grantRole(history.ADMIN(), jaothui.address);
//     await history.grantRole(history.ADMIN(), metadata.address);
//     await history.grantRole(history.ADMIN(), reward.address);

//     //7. Grant Role of owner to the metadata and reward in order to be able to control over them
//     await metadata.grantRole(metadata.ADMIN(), thui.address);
//     await reward.grantRole(metadata.ADMIN(), thui.address);

//     return {
//       thui,
//       holder1,
//       holder2,
//       holder3,
//       jaothui,
//       history,
//       metadata,
//       reward,
//     };
//   }

//   it("* Should be able to deploy the system.", async () => {
//     try {
//       await deploy();
//       expect(true);
//     } catch (error) {
//       expect(false);
//     }
//   });

//   describe("- Jaothui NFT", async () => {
//     it("1. Should be able to mint one NFT with correct token incremental.", async () => {
//       const { thui, holder1, jaothui } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       expect((await jaothui.balanceOf(holder1.address)).toString()).to.equal(
//         "1"
//       );
//       expect((await jaothui.totalSupply()).toString()).to.equal("1");
//     });

//     it("2. Should be able to mint multiple token with correct tokenId at the end", async () => {
//       const { thui, holder1, holder2, holder3, jaothui } = await deploy();

//       //1. prepare metadata
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       expect((await jaothui.balanceOf(holder1.address)).toString()).to.equal(
//         "1"
//       );
//       expect((await jaothui.balanceOf(holder1.address)).toString()).to.equal(
//         "1"
//       );
//       expect((await jaothui.balanceOf(holder1.address)).toString()).to.equal(
//         "1"
//       );

//       expect(await jaothui.ownerOf("1")).to.equal(holder1.address);
//       expect(await jaothui.ownerOf("2")).to.equal(holder2.address);
//       expect(await jaothui.ownerOf("3")).to.equal(holder3.address);

//       expect((await jaothui.totalSupply()).toString()).to.equal("3");
//     });
//   });

//   describe("- Jaothui Metadata Manager ", async () => {
//     it("1. should not be able to add Metadata without Jaothui was minted", async () => {
//       const { thui, holder1, metadata } = await deploy();

//       //1. try to mint metadata without jaothui minting
//       await expect(
//         metadata.connect(thui).addMetadata(1, {
//           name: "Bao Vee",
//           microchip: (972813475296584).toString(),
//           certNo: "11/15",
//           origin: "thai",
//           color: "pale pink",
//           imageUri: imageIpfs[0],
//           detail: "Detail",
//           sex: "female",
//           rarity: "N",
//           birthdate: 1476091200,
//           height: 145,
//           issuedAt: new Date().getTime(),
//         })
//       ).to.revertedWith("invalid token id");
//     });
//     it("2. Should be able to add Metadata of the minted jaothui token", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);
//       await metadata.connect(thui).addMetadata(1, metadatas[0]);

//       expect((await metadata.totalMetadata()).toString()).to.equal("1");
//       expect(
//         (await metadata.microchipToTokenId(metadatas[0].microchip)).toString()
//       ).to.equal("1");
//     });

//     it("3. Should be able to add Metadata of the multiple token of the minted jaothui tokens", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, metadata } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       //2.add multiple metadata
//       await metadata
//         .connect(thui)
//         .addMetadataBatch(
//           [1, 2, 3],
//           [metadatas[0], metadatas[1], metadatas[2]]
//         );

//       expect((await metadata.totalMetadata()).toString()).to.equal("3");
//     });
//     it("4. Should be able to get metadata by microchip", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, metadata } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       await metadata
//         .connect(thui)
//         .addMetadataBatch(
//           [1, 2, 3],
//           [metadatas[0], metadatas[1], metadatas[2]]
//         );

//       const data = await metadata.getMetadataByMicrochip(
//         metadatas[0].microchip
//       );

//       expect(data.certify.microchip).to.equal(metadatas[0].microchip);
//     });

//     it("5. Should not be able to addMetadata if not admin", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, metadata } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       await expect(
//         metadata.connect(holder1).addMetadata(1, metadatas[0])
//       ).to.revertedWith(
//         "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42"
//       );
//     });

//     it("6. Should be able to set Buffalo a new Name", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);
//       await metadata.connect(thui).addMetadata(1, metadatas[0]);

//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       const data = await metadata.getMetadata(1);

//       expect(data.name).to.equal("Bao SuSie!");
//     });
//     it("7. Should be able add new Approvers", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).addApprover(certIpfs[0]);
//       await metadata.connect(thui).addApprover(certIpfs[1]);

//       expect((await metadata.getAllApprover()).length).to.equal(2);
//     });

//     it("8. Should be able to add ApprovedBy to buffalo by TokenId", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).addApprover(certIpfs[0]);
//       await metadata.connect(thui).addApprover(certIpfs[1]);

//       await metadata.connect(thui).setApprovedBy(1, 0, "", false);

//       expect((await metadata.getAllApprover()).length).to.equal(2);
//       const data = await metadata.connect(thui).getApprovedByTokenId(1, false);
//       expect(data[0][0]).to.equal(certIpfs[0]);
//     });
//     it("9. Should be able to add ApprovedBy to buffalo by microchip", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).addApprover(certIpfs[0]);
//       await metadata.connect(thui).addApprover(certIpfs[1]);

//       await metadata.connect(thui).setApprovedBy(972813475296584, 0, "", true);

//       expect((await metadata.getAllApprover()).length).to.equal(2);
//       const data = await metadata
//         .connect(thui)
//         .getApprovedByTokenId(972813475296584, true);
//       expect(data[0][0]).to.equal(certIpfs[0]);
//     });
//     it("10. Should be able to remove approver", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).addApprover(certIpfs[0]);
//       await metadata.connect(thui).addApprover(certIpfs[1]);

//       await metadata.connect(thui).removeApprover(0);

//       expect((await metadata.getAllApprover()).length).to.equal(1);
//     });

//     it("11. Should be able to remove approvedBy from buffalo", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).addApprover(certIpfs[0]);
//       await metadata.connect(thui).addApprover(certIpfs[1]);

//       await metadata.connect(thui).setApprovedBy(1, 0, "", false);
//       await metadata.connect(thui).setApprovedBy(1, 1, "", false);

//       expect((await metadata.getApprovedByTokenId(1, false)).length).to.equal(
//         2
//       );

//       await metadata.removeApprovedByFromTokenId(1, 0);

//       const data = await metadata.getApprovedByTokenId(1, false);
//       expect(data.length).to.equal(1);
//     });
//     it("12. Should be able to add DNA", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);
//       await metadata.connect(thui).setName(1, "Bao SuSie!");

//       await metadata.connect(thui).setDNA(1, certIpfs[0]);

//       expect((await metadata.getMetadata(1)).certify.dna).to.equal(certIpfs[0]);
//     });
//     it("13. Should be able to set parent to minted token", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.connect(thui).addMetadata(1, metadatas[0]);

//       const motherId = "15455KKK";
//       const fatherId = "15466DDA";

//       //@dev set parent
//       await metadata.setParent(1, fatherId, motherId);

//       const m = await metadata.getMetadata(1);

//       expect(m.relation.motherTokenId).to.equals(motherId);
//     });

//     it("14. Should be able to use character with the microchip and able to search and do everything just like uint256", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       const metadataWithStringId = {
//         name: "Bao Vee",
//         microchip: "9728134752DDAR",
//         certNo: "11/15",
//         origin: "thai",
//         color: "pale pink",
//         imageUri: imageIpfs[0],
//         detail: "Detail",
//         sex: "female",
//         rarity: "N",
//         birthdate: 1476091200,
//         height: 145,
//         issuedAt: new Date().getTime(),
//       };

//       await metadata.connect(thui).addMetadata(1, metadataWithStringId);

//       const motherId = "15455KKK";
//       const fatherId = "15466DDA";

//       //@dev set parent
//       await metadata.setParent(1, fatherId, motherId);

//       const m = await metadata.getMetadata(1);

//       //@Dev get parentId
//       expect(m.relation.motherTokenId).to.equals(motherId);
//       //@Dev get metadata my microchipId
//       const m1 = await metadata.getMetadataByMicrochip(
//         metadataWithStringId.microchip
//       );
//       expect(m1.certify.microchip).to.equals(metadataWithStringId.microchip);
//     });

//     it("15. Should be able to add approval doc url", async () => {
//       const { thui, holder1, jaothui, metadata } = await deploy();
//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       const metadataWithStringId = {
//         name: "Bao Vee",
//         microchip: "9728134752DDAR",
//         certNo: "11/15",
//         origin: "thai",
//         color: "pale pink",
//         imageUri: imageIpfs[0],
//         detail: "Detail",
//         sex: "female",
//         rarity: "N",
//         birthdate: 1476091200,
//         height: 145,
//         issuedAt: new Date().getTime(),
//       };
//       const mockDocUrl = "https://docUrl.com/doc.pdf";
//       const approverLogo = "https://ipfs.io/approver.png";

//       await metadata.connect(thui).addMetadata(1, metadataWithStringId);
//       await metadata.connect(thui).addApprover(approverLogo);
//       //@notice : no doc set at the first place
//       await metadata.connect(thui).setApprovedBy(1, 0, "", false);

//       await metadata.connect(thui).setApprovedDoc(1, 0, mockDocUrl);

//       const m = await metadata.getApprovedByTokenId(1, false);

//       expect(m[0].docUri).to.equals(mockDocUrl);
//       expect(m[0].uri).to.equals(approverLogo);
//     });
//   });
//   describe("- Jaothui Reward Manager", async () => {
//     it("1. should not be able to add Reward without Jaothui was minted", async () => {
//       const { thui, reward } = await deploy();

//       await expect(
//         reward.connect(thui).addReward(1, {
//           rewardUri: imageIpfs[0],
//           microchip: metadatas[0].microchip,
//         })
//       ).to.revertedWith("invalid token id");
//     });
//     it("2. Should be able to add Reward of the minted jaothui token", async () => {
//       const { thui, jaothui, holder1, reward } = await deploy();
//       await jaothui.mintWithMetadata(
//         holder1.address,
//         imageIpfs[0],
//         certIpfs[0]
//       );

//       await expect(
//         reward.connect(thui).addReward(1, {
//           rewardUri: imageIpfs[0],
//           microchip: metadatas[0].microchip,
//         })
//       ).to.not.revertedWith("invalid token id");
//     });

//     it("3. Should be able to add Reward of the multiple token of the minted jaothui tokens", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, reward } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       //2.add multiple metadata
//       await reward
//         .connect(thui)
//         .addRewardBatch([1, 2, 3], [rewards[0], rewards[1], rewards[2]]);

//       expect((await reward.totalReward()).toString()).to.equal("3");
//     });
//     it("4. Should be able to get Reward by microchip", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, reward } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       await reward
//         .connect(thui)
//         .addRewardBatch([1, 2, 3], [rewards[0], rewards[1], rewards[2]]);

//       const data = await reward.getRewardByMicrochip(metadatas[0].microchip);

//       expect(data[0].rewardUri).to.equal(rewards[0].rewardUri);
//     });

//     it("5. Should not be able to addReward if not admin", async () => {
//       const { thui, holder1, holder2, holder3, jaothui, reward } =
//         await deploy();
//       //1. mint multiple tokens
//       const wallets = [holder1.address, holder2.address, holder3.address];
//       const images = [
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//         "https://nftstorage.link/ipfs/bafkreidzang3tja3yg55l5qfavjyflzdxmkv3fhaq3d25trtaumtocp4k4",
//       ];
//       const tokenUris = [certIpfs[0], certIpfs[1], certIpfs[2]];

//       await jaothui
//         .connect(thui)
//         .mintWithMetadataBatch(wallets, images, tokenUris);

//       await expect(
//         reward.connect(holder1).addReward(1, rewards[0])
//       ).to.revertedWith(
//         "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42"
//       );
//     });
//   });
//   describe("- Jaothui History Manager", async () => {
//     it("1. Should be able to track Jaothui Minting", async () => {
//       const { thui, jaothui, holder1, history } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       const historyData = await history.getHistoryOf(1);

//       expect(historyData[1].title).to.equal("mint");
//     });

//     it("2. Should be able to track the metadata adding history", async () => {
//       const { thui, jaothui, holder1, metadata, history } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await metadata.addMetadata(1, metadatas[0]);

//       const historyData = await history.getHistoryOf(1);

//       expect(historyData[2].title).to.equal("addMetadata");
//     });

//     it("3. Should be able to track the reward adding history", async () => {
//       const { thui, jaothui, holder1, reward, history } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await reward.addReward(1, rewards[0]);

//       const historyData = await history.getHistoryOf(1);

//       expect(historyData[2].title).to.equal("addReward");
//     });

//     it("4. Should be able to track the token transfer history", async () => {
//       const { thui, jaothui, holder1, holder2, history } = await deploy();

//       await jaothui
//         .connect(thui)
//         .mintWithMetadata(holder1.address, imageIpfs[0], certIpfs[0]);

//       await jaothui
//         .connect(holder1)
//         .transferFrom(holder1.address, holder2.address, 1);

//       const historyData = await history.getHistoryOf(1);

//       expect(historyData[2].title).to.equal("transfer");
//     });
//   });
// });
