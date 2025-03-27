const NEW_PLAY_EARN_CONTRACT = "NewPlayEarnReward";

module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;

  const newPlayEarnContract = await deploy(NEW_PLAY_EARN_CONTRACT, {
    from: deployer,
    log: true,
    args: [treasure],
  });
  if (newPlayEarnContract.newlyDeployed) {
    await execute(
      NEW_PLAY_EARN_CONTRACT,
      { from: deployer, log: true },
      "grantRole",
      await read(NEW_PLAY_EARN_CONTRACT, "MANAGER_ROLE"),
      manager
    );
  }
};
module.exports.tags = [NEW_PLAY_EARN_CONTRACT];
