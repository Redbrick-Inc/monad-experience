const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("StepByStepContract", function () {
  async function setup() {
    await deployments.fixture(["StepByStepContract"]);
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const gamepassMarket = await ethers.getContract(
      "StepByStepContract",
      deployer
    );

    return {
      deployer,
      manager,
      treasureWallet: treasure,
      gamepassMarket,
    };
  }
  let deployer;
  let manager;
  let gamepassMarket;
  let fee = ethers.parseEther("0.0000018");
  let treasureWallet;
  beforeEach(async () => {
    ({ deployer, manager, gamepassMarket, treasureWallet } = await setup());
  });
  async function genSign(
    signer,
    senderAddr,
    claimId,
    bricRoleAmount,
    badge,
    point,
    price,
    nonce,
    deadline
  ) {
    const msgHash = ethers.getBytes(
      ethers.solidityPackedKeccak256(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256[]",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          hre.network.config.chainId,
          gamepassMarket.target,
          senderAddr,
          claimId,
          [bricRoleAmount, badge, point],
          price,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }

  async function claim(
    to,
    claimId,
    bricRoleAmount,
    badge,
    point,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      claimId,
      bricRoleAmount,
      badge,
      point,
      price,
      nonce,
      deadline
    );
    const tx = gamepassMarket
      .connect(to)
      .claim(
        claimId,
        [bricRoleAmount, badge, point],
        nonce,
        deadline,
        signature,
        { value: price }
      );
    await expect(tx).changeEtherBalances([treasureWallet, to], [price, -price]);
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(gamepassMarket, "Claimed")
        .withArgs(to.address, claimId, [bricRoleAmount, badge, point], nonce);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
    }
  }

  it("Mint", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const nonce = 1;
    const deadline = (await time.latest()) + 10000;
    const price = 1;
    const claimId = 1;
    const bricRoleAmount = 1;
    const badge = 1;
    const point = 1;
    await claim(
      to,
      claimId,
      bricRoleAmount,
      badge,
      point,
      price,
      nonce,
      deadline
    );
  });
});
