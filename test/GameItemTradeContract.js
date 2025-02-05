const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("DailyRewardContract", function () {
  async function setup() {
    await deployments.fixture(["GameItemTradeContract"]);
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const gameItemMarket = await ethers.getContract(
      "GameItemTradeContract",
      deployer
    );

    return {
      deployer,
      manager,
      treasureWallet: treasure,
      gameItemMarket,
    };
  }
  let deployer;
  let manager;
  let gameItemMarket;
  let fee = ethers.parseEther("0.0000018");
  let treasureWallet;
  beforeEach(async () => {
    ({ deployer, manager, gameItemMarket, treasureWallet } = await setup());
  });

  async function genSignRefill(
    signer,
    senderAddr,
    item,
    amount,
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
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          hre.network.config.chainId,
          gameItemMarket.target,
          senderAddr,
          item,
          amount,
          point,
          price,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }

  async function buyItem(
    to,
    item,
    amount,
    point,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSignRefill(
      manager,
      to.address,
      item,
      amount,
      point,
      price,
      nonce,
      deadline
    );
    const tx = gameItemMarket
      .connect(to)
      .buy(item, amount, point, nonce, deadline, signature, { value: price });
    await expect(tx).changeEtherBalances([treasureWallet, to], [price, -price]);
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(gameItemMarket, "Bought")
        .withArgs(to.address, item, amount, point, price, nonce);
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
    const point = 1;
    const item = 1;
    const amount = 5;
    const price = 0;
    await buyItem(to, item, amount, point, price, nonce, deadline);
  });
});
