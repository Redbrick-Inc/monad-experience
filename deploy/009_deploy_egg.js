const EASTER_EGG_REWARD = "EasterEggContract";
const MONLANDAK_NFT = "BrikieMolandakNFT";

module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;
  const monlandakDeployed = await deploy(MONLANDAK_NFT, {
    from: deployer,
    log: true,
    args: ["Brikie&Molandak", "BrikieMolandakNFT"],
  });

  //Deploy easter egg
  const easterEggReward = await deploy(EASTER_EGG_REWARD, {
    from: deployer,
    log: true,
    args: [monlandakDeployed.address, treasure],
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
  }
};
module.exports.tags = [EASTER_EGG_REWARD];
