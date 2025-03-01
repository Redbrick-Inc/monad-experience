const BRICKIE_NFT = "BrikieNFT";
const EASTER_EGG_REWARD = "EasterEggContract";
const MONLANDAK_NFT = "MolandakNFT";

const WEEKLY_REWARD = "WeeklyRewardContract";
const hre = require("hardhat");
module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;
  const monlandakDeployed = await deploy(MONLANDAK_NFT, {
    from: deployer,
    log: true,
    args: ["Monlandak", "Monlandak"],
  });

  //Get address brikieNFT
  let brikieNFTAddr = process.env.BRIKIE_NFT_ADDR;
  if (!hre.network.live) {
    const brikieNFT = await deployments.get(BRICKIE_NFT);
    brikieNFTAddr = brikieNFT.address;
    console.log("brikieNFT in easter egg", brikieNFTAddr);
  }

  //Deploy easter egg
  const easterEggReward = await deploy(EASTER_EGG_REWARD, {
    from: deployer,
    log: true,
    args: [brikieNFTAddr, monlandakDeployed.address, treasure],
  });

  if (monlandakDeployed.newlyDeployed) {
    await execute(
      MONLANDAK_NFT,
      { from: deployer, log: true },
      "grantRole",
      await read(MONLANDAK_NFT, "MANAGER_ROLE"),
      easterEggReward.address
    );
  }
  if (easterEggReward.newlyDeployed) {
    await execute(
      EASTER_EGG_REWARD,
      { from: deployer, log: true },
      "grantRole",
      await read(EASTER_EGG_REWARD, "MANAGER_ROLE"),
      manager
    );

    const brikieNFTContract = await ethers.getContractAt(
      BRICKIE_NFT,
      brikieNFTAddr
    );

    const signer = await ethers.getSigner(deployer);
    const tx = await brikieNFTContract
      .connect(signer)
      .grantRole(
        await brikieNFTContract.MANAGER_ROLE(),
        easterEggReward.address
      );

    await tx.wait();
  }
};
module.exports.dependencies = [WEEKLY_REWARD];
module.exports.tags = [EASTER_EGG_REWARD];
