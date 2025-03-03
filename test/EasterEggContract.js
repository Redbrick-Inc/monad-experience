const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
var _ = require("lodash");
describe("Easter egg claim", function () {
  async function setup() {
    await deployments.fixture(["EasterEggContract"]);
    const { deployer, manager, treasure } = await ethers.getNamedSigners();
    const easterEggcontract = await ethers.getContract(
      "EasterEggContract",
      deployer
    );

    return {
      deployer,
      manager,
      treasureWallet: treasure,
      easterEggcontract,
    };
  }
  let deployer;
  let manager;
  let easterEggcontract;
  let fee = ethers.parseEther("0.0000018");
  let treasureWallet;
  beforeEach(async () => {
    ({ deployer, manager, easterEggcontract, treasureWallet } = await setup());
  });
  async function genSign(
    signer,
    senderAddr,
    eggId,
    stars,
    monlandakTokenId,
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
          easterEggcontract.target,
          senderAddr,
          eggId,
          [stars, monlandakTokenId],
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
    eggId,
    stars,
    monlandakTokenId,
    price,
    nonce,
    deadline,
    isReverted = false,
    revertMsg = undefined
  ) {
    let signature = await genSign(
      manager,
      to.address,
      eggId,
      stars,
      monlandakTokenId,
      price,
      nonce,
      deadline
    );
    const tx = easterEggcontract
      .connect(to)
      .claimEgg(eggId, [stars, monlandakTokenId], nonce, deadline, signature, {
        value: price,
      });
    await expect(tx).changeEtherBalances([treasureWallet, to], [price, -price]);
    if (!isReverted) {
      await tx;
      await expect(tx)
        .to.emit(easterEggcontract, "ClaimedEgg")
        .withArgs(to.address, eggId, [stars, monlandakTokenId], nonce);
    } else {
      if (revertMsg) {
        await expect(tx).to.revertedWith(revertMsg);
      } else {
        await expect(tx).to.reverted;
      }
    }
  }

  it("Easter egg claim", async function () {
    const [to] = await ethers.getUnnamedSigners();
    const nonce = 1;
    const deadline = (await time.latest()) + 10000;
    const price = 1;
    const eggId = 1;
    const stars = 3;
    const monlandakTokenId = 1;
    await claim(to, eggId, stars, monlandakTokenId, price, nonce, deadline);
  });
});
