const BRICKIE_NFT = "BrikieNFT";
const WEEKLY_REWARD = "WeeklyRewardContract";

module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;
  const deployed = await deploy(BRICKIE_NFT, {
    from: deployer,
    log: true,
    args: ["Brikie", "Brikie"],
  });
  const gamepassMarketContract = await deploy(WEEKLY_REWARD, {
    from: deployer,
    log: true,
    args: [deployed.address, treasure],
  });
  if (deployed.newlyDeployed) {
    await execute(
      BRICKIE_NFT,
      { from: deployer, log: true },
      "grantRole",
      await read(BRICKIE_NFT, "MANAGER_ROLE"),
      gamepassMarketContract.address
    );
  }
  if (gamepassMarketContract.newlyDeployed) {
    await execute(
      WEEKLY_REWARD,
      { from: deployer, log: true },
      "grantRole",
      await read(WEEKLY_REWARD, "MANAGER_ROLE"),
      manager
    );
  }
};
module.exports.tags = [WEEKLY_REWARD];
