require("@nomicfoundation/hardhat-toolbox");
require("hardhat-abi-exporter");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config({ path: "./.env.local" });
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      monad_testnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
      monad_mainnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
    },
    manager: {
      default: 1,
      monad_testnet: process.env.MANAGER_ADDR,
      monad_mainnet: process.env.MANAGER_ADDR,
    },
    treasure: {
      default: 1,
      monad_testnet: process.env.TREASURE_ADDR,
      monad_mainnet: process.env.TREASURE_ADDR,
    },
  },
  networks: {
    monad_testnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 5611,
      gasPrice: 3_000_000_000,
    },
    monad_mainnet: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 204,
    },
  },
  gasReporter: {
    enabled: true,
  },
};
