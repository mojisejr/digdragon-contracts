import { expect } from "chai";
import { ethers } from "hardhat";

describe("Draca Token Test", () => {
  async function deploy() {
    const [owner, acc1, acc2] = await ethers.getSigners();

    const dracaFac = await ethers.getContractFactory("DracaToken");

    const draca = await dracaFac.deploy();
    await draca.deployed();

    return {
      owner,
      acc1,
      acc2,
      draca,
    };
  }

  it("1. should be able to mint by MINTER_ROLE", async () => {
    const { owner, draca, acc1 } = await deploy();

    const mintAmount = 1000000000000000000000n;

    await draca.connect(owner).mint(acc1.address, mintAmount);

    const balance = await draca.balanceOf(acc1.address);

    expect(balance.toString()).to.equal(mintAmount.toString());
  });

  it("2. should not be able to transfer to other one", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    const mintAmount = 1000000000000000000000n;

    await draca.connect(owner).mint(acc1.address, mintAmount);

    await expect(draca.connect(acc1).transfer(acc2.address, mintAmount)).to.be
      .reverted;
  });

  it("3. should be able to create new event", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    await draca.addEvent(
      [acc1.address, acc2.address],
      [10000000000000000000n, 20000000000000000000n],
      1703001703,
      1703062903
    );

    await expect(draca.getEvent(1)).to.not.reverted;
  });

  it("4. should be able to claim the reward from event", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    await draca.addEvent(
      [acc1.address, acc2.address],
      [10000000000000000000n, 20000000000000000000n],
      1703001703,
      1703062903
    );

    //claim event id 1
    await draca.connect(acc1).claim(1);

    expect((await draca.balanceOf(acc1.address)).toString()).to.equal(
      "10000000000000000000"
    );
  });

  it("5. should be able to create multi event", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    await draca.addEvent(
      [acc1.address, acc2.address],
      [10000000000000000000n, 20000000000000000000n],
      1703001703,
      1703062903
    );

    await draca.addEvent(
      [acc2.address],
      [5000000000000000000n],
      1703001703,
      1703062903
    );

    await draca.connect(acc1).claim(1);
    await draca.connect(acc2).claim(2);

    expect((await draca.balanceOf(acc1.address)).toString()).to.equal(
      "10000000000000000000"
    );
    expect((await draca.balanceOf(acc2.address)).toString()).to.equal(
      "5000000000000000000"
    );
  });

  it("6. should be able to get All events", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    await draca.addEvent(
      [acc1.address, acc2.address],
      [10000000000000000000n, 20000000000000000000n],
      1703001703,
      1703062903
    );

    await draca.addEvent(
      [acc2.address],
      [5000000000000000000n],
      1703001703,
      1703062903
    );

    const events = await draca.getAllEvents();

    expect(events.length).to.equal(2);
  });

  it("7. should be able to get getAllEventsAndClaimableOf", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    await draca.addEvent(
      [acc1.address, acc2.address],
      [10000000000000000000n, 20000000000000000000n],
      1703001703,
      1703062903
    );

    await draca.addEvent(
      [acc2.address],
      [5000000000000000000n],
      1703001703,
      1703062903
    );

    const events = await draca.getAllEventsAndClaimableOf(acc1.address);

    expect(events.length).to.equal(3);
  });

  it("8. should be able to transfer only if has EVENT_MANAGER role", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    const mintAmount = 1000000000000000000000n;

    await draca.mint(owner.address, mintAmount);

    await draca.transfer(acc1.address, mintAmount);

    const balance = await draca.balanceOf(acc1.address);

    expect(balance.toString()).to.equal(mintAmount.toString());
  });

  it("9. blacklisted cannot be transfer and received any tokens", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    const mintAmount = 1000000000000000000000n;

    await draca.mint(owner.address, mintAmount);

    await draca.transfer(acc1.address, mintAmount);

    await draca.addBacklist(acc1.address);

    await draca.mint(owner.address, mintAmount);

    await expect(draca.transfer(acc1.address, mintAmount)).to.be.reverted;
    await expect(draca.connect(acc1).transfer(owner.address, mintAmount)).to.be
      .reverted;
  });

  it("10. should be able to transfer only to RECEVIER if not the EVENT MANAGER role", async () => {
    const { owner, draca, acc1, acc2 } = await deploy();

    const mintAmount = 1000000000000000000000n;

    await draca.mint(owner.address, mintAmount);

    await draca.transfer(acc1.address, mintAmount);

    await expect(draca.connect(acc1).transfer(acc2.address, mintAmount)).to.be
      .reverted;
    expect(await draca.connect(acc1).transfer(owner.address, mintAmount)).to.be
      .ok;
    expect((await draca.balanceOf(owner.address)).toString()).to.equal(
      mintAmount.toString()
    );
  });
});
