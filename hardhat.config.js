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
      opBNB_testnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
      eth_testnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
    },
    manager: {
      default: 1,
      opBNB_testnet: process.env.MANAGER_ADDR,
      eth_testnet: process.env.MANAGER_ADDR,
    },
    treasure: {
      default: 1,
      opBNB_testnet: process.env.TREASURE_ADDR,
      eth_testnet: process.env.TREASURE_ADDR,
    },
  },
  networks: {
    opBNB_testnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 5611,
      gasPrice: 3_000_000_000,
    },
    eth_testnet: {
      url: "https://rpc.ankr.com/eth_sepolia",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  gasReporter: {
    enabled: true,
  },
};
