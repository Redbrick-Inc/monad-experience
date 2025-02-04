const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("LuckyDraw", function () {
  async function setup() {
    await deployments.fixture("LuckyDrawContract");
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const luckyDrawContract = await ethers.getContract(
      "LuckyDrawContract",
      deployer
    );
    return {
      deployer,
      manager,
      treasureWallet: treasure,
      luckyDrawContract,
    };
  }
  let deployer;
  let manager;
  let treasureWallet;
  let luckyDrawContract;
  let luckyDrawLimitPerAddr;
  beforeEach(async () => {
    ({ deployer, manager, luckyDrawContract, treasureWallet } = await setup());
    luckyDrawLimitPerAddr = 1;
  });
  async function genSign(signer, senderAddr, gameId, price, nonce, deadline) {
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
          luckyDrawContract.target,
          senderAddr,
          gameId,
          price,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }
  async function sendBuyLuckyDraw(
    to,
    gameId,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      gameId,
      price,
      nonce,
      deadline
    );

    const preTotalLuckyDraw = await luckyDrawContract._totalLuckyDraw();
    const preLuckyDrawOfDate = await luckyDrawContract._gameLuckyDraw(gameId);
    const tx = luckyDrawContract
      .connect(to)
      .buyLuckyDraw(gameId, nonce, deadline, signature, { value: price });
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(luckyDrawContract, "LuckyDraw")
        .withArgs(gameId, to.address, price, nonce);
      await expect(tx).changeEtherBalances(
        [treasureWallet, to],
        [price, -price]
      );
      const postTotalLuckyDraw = await luckyDrawContract._totalLuckyDraw();
      const postLuckyDrawOfDate = await luckyDrawContract._gameLuckyDraw(
        gameId
      );
      expect(postTotalLuckyDraw - preTotalLuckyDraw).to.be.equal(1n);
      expect(postLuckyDrawOfDate - preLuckyDrawOfDate).to.be.equal(1n);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
      const postTotalLuckyDraw = await luckyDrawContract._totalLuckyDraw();
      const postLuckyDrawOfDate = await luckyDrawContract._gameLuckyDraw(
        gameId
      );
      expect(postTotalLuckyDraw - preTotalLuckyDraw).to.be.equal(0n);
      expect(postLuckyDrawOfDate - preLuckyDrawOfDate).to.be.equal(0n);
    }
  }
  it("Should success when buying single luckyDraw", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const nonce = 1;
    const deadline = (await time.latest()) + 10000;
    const price = 1;
    const gameId = 1;
    await sendBuyLuckyDraw(to, gameId, price, nonce, deadline);
  });
});
