const GAME_PASS_NFT = "GamePassNFT";
const GAME_PASS_MARKET = "GamePassMarketContract";

module.exports = async ({ ethers, deployments, getNamedAccounts }) => {
  const { deployer, manager, treasure } = await getNamedAccounts();
  const { deploy, execute, read } = deployments;
  const deployed = await deploy(GAME_PASS_NFT, {
    from: deployer,
    log: true,
    args: ["GPass", "GPass"],
  });
  const gamepassMarketContract = await deploy(GAME_PASS_MARKET, {
    from: deployer,
    log: true,
    args: [deployed.address, treasure],
  });
  if (deployed.newlyDeployed) {
    await execute(
      GAME_PASS_NFT,
      { from: deployer, log: true },
      "grantRole",
      await read(GAME_PASS_NFT, "MANAGER_ROLE"),
      gamepassMarketContract.address
    );
  }
  if (gamepassMarketContract.newlyDeployed) {
    await execute(
      GAME_PASS_MARKET,
      { from: deployer, log: true },
      "grantRole",
      await read(GAME_PASS_MARKET, "MANAGER_ROLE"),
      manager
    );
  }
};
module.exports.tags = [GAME_PASS_NFT];
