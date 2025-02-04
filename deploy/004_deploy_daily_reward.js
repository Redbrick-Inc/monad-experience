const CONTRACT_NAME = "DailyRewardContract";

module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;
  const deployed = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: [],
  });

  if (deployed.newlyDeployed) {
    await execute(
      CONTRACT_NAME,
      { from: deployer, log: true },
      "grantRole",
      await read(CONTRACT_NAME, "MANAGER_ROLE"),
      manager
    );
  }
};
module.exports.tags = [CONTRACT_NAME];
