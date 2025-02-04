const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("DailyRewardContract", function () {
  async function setup() {
    await deployments.fixture(["DailyRewardContract"]);
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const playEarnContract = await ethers.getContract(
      "DailyRewardContract",
      deployer
    );

    return {
      deployer,
      manager,
      treasureWallet: treasure,
      playEarnContract,
    };
  }
  let deployer;
  let manager;
  let playEarnContract;
  let fee = ethers.parseEther("0.0000018");
  let treasureWallet;
  beforeEach(async () => {
    ({ deployer, manager, playEarnContract, treasureWallet } = await setup());
  });
  async function genSign(signer, senderAddr, dateId, point, nonce, deadline) {
    const msgHash = ethers.getBytes(
      ethers.solidityPackedKeccak256(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          hre.network.config.chainId,
          playEarnContract.target,
          senderAddr,
          dateId,
          point,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }
  async function sendClaim(
    to,
    dateId,
    point,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      dateId,
      point,
      nonce,
      deadline
    );
    const tx = playEarnContract
      .connect(to)
      .claim(dateId, point, nonce, deadline, signature);

    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(playEarnContract, "Claimed")
        .withArgs(to.address, dateId, point, nonce);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
    }
  }
  it("Should success when claiming", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const dateId = 1;
    const point = 10;
    const nonce = 1;
    const deadline = (await time.latest()) + 10000;
    await sendClaim(to, dateId, point, nonce, deadline);
  });
  it("Should revert when re-claiming in same date", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const dateId = 1;
    const point = 10;
    const nonce = 1;
    const deadline = (await time.latest()) + 10000;
    await sendClaim(to, dateId, point, nonce, deadline);
    const newNonce = 2;
    const newDeadline = (await time.latest()) + 10000;
    await sendClaim(
      to,
      dateId,
      point,
      newNonce,
      newDeadline,
      true,
      "already claim this date"
    );
  });
});
