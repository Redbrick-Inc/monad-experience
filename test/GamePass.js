const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("DailyRewardContract", function () {
  async function setup() {
    await deployments.fixture(["GamePassNFT"]);
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const gamepassMarket = await ethers.getContract(
      "GamePassMarketContract",
      deployer
    );
    const GamePassNFT = await ethers.getContract("GamePassNFT", deployer);

    console.log(GamePassNFT.target);
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
  async function genSign(signer, senderAddr, tokenId, price, nonce, deadline) {
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
          gamepassMarket.target,
          senderAddr,
          tokenId,
          price,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }

  async function genSignRefill(
    signer,
    senderAddr,
    tokenId,
    plays,
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
        ],
        [
          hre.network.config.chainId,
          gamepassMarket.target,
          senderAddr,
          tokenId,
          plays,
          price,
          nonce,
          deadline,
        ]
      )
    );
    return signer.signMessage(msgHash);
  }
  async function buyMint(
    to,
    tokenId,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      tokenId,
      price,
      nonce,
      deadline
    );
    const tx = gamepassMarket
      .connect(to)
      .mint(tokenId, nonce, deadline, signature, { value: price });
    await expect(tx).changeEtherBalances([treasureWallet, to], [price, -price]);
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(gamepassMarket, "Minted")
        .withArgs(to.address, tokenId, price, nonce);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
    }
  }

  async function refill(
    to,
    tokenId,
    plays,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSignRefill(
      manager,
      to.address,
      tokenId,
      plays,
      price,
      nonce,
      deadline
    );
    const tx = gamepassMarket
      .connect(to)
      .refill(tokenId, plays, nonce, deadline, signature, { value: price });
    await expect(tx).changeEtherBalances([treasureWallet, to], [price, -price]);
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(gamepassMarket, "Refilled")
        .withArgs(to.address, tokenId, plays, price, nonce);
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
    const tokenId = 1;
    const plays = 5;
    await buyMint(to, tokenId, price, nonce, deadline);
    await refill(to, tokenId, plays, price, 2, deadline);
  });
});
