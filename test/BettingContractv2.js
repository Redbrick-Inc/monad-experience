const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("Betting Contract v2", function () {
  async function setup() {
    await deployments.fixture();
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const bettingContract = await ethers.getContract(
      "BettingContract",
      deployer
    );

    return {
      deployer,
      manager,
      treasureWallet: treasure,
      bettingContract,
    };
  }
  let deployer;
  let manager;
  let bettingContract;
  let fee = ethers.parseEther("0.0000018");
  let treasureWallet;
  beforeEach(async () => {
    ({ deployer, manager, bettingContract, treasureWallet } = await setup());
  });
  async function genSign(
    signer,
    senderAddr,
    gameId,
    voteType,
    stars,
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
          "uint256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          hre.network.config.chainId,
          bettingContract.target,
          senderAddr,
          gameId,
          voteType,
          stars,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }
  async function sendBet(
    to,
    gameId,
    voteType,
    stars,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      gameId,
      voteType,
      stars,
      nonce,
      deadline
    );
    const tx = bettingContract
      .connect(to)
      .bet(gameId, voteType, stars, nonce, deadline, signature, {
        value: fee,
      });

    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(bettingContract, "BetEvent")
        .withArgs(to.address, gameId, voteType, stars, nonce);
      await expect(tx).changeEtherBalances([treasureWallet, to], [fee, -fee]);
      const betData = await bettingContract._bets(gameId, to.address);
      expect(betData.isJoined).to.be.equal(true);
      expect(betData.voteType).to.be.equal(voteType);
      expect(betData.stars).to.be.equal(stars);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
    }
  }
  it("Should success when betting", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const voteType = 1;
    const stars = 10;
    const nonce = 1;
    const gameId = 1;
    const deadline = (await time.latest()) + 10000;
    await sendBet(to, gameId, voteType, stars, nonce, deadline);
  });

  it("Should be reverted when re-betting", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const voteType = 1;
    const stars = 10;
    const gameId = 1;
    let nonce = 1;
    let deadline = (await time.latest()) + 10000;
    await sendBet(to, gameId, voteType, stars, nonce, deadline);
    nonce = 2;
    deadline = (await time.latest()) + 10000;
    await sendBet(
      to,
      gameId,
      voteType,
      stars,
      nonce,
      deadline,
      true,
      "already joined"
    );
  });
});
