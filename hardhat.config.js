require("@nomicfoundation/hardhat-toolbox");
require("hardhat-abi-exporter");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config({ path: "./.env.prod" });
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
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
      monad_testnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
      agld_testnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
      opBNB_mainnet: `privatekey://${process.env.DEPLOY_PRIVATE_KEY}`,
    },
    manager: {
      default: 1,
      opBNB_testnet: process.env.MANAGER_ADDR,
      eth_testnet: process.env.MANAGER_ADDR,
      monad_testnet: process.env.MANAGER_ADDR,
      agld_testnet: process.env.MANAGER_ADDR,
      opBNB_mainnet: process.env.MANAGER_ADDR,
    },
    treasure: {
      default: 1,
      opBNB_testnet: process.env.TREASURE_ADDR,
      eth_testnet: process.env.TREASURE_ADDR,
      monad_testnet: process.env.TREASURE_ADDR,
      agld_testnet: process.env.TREASURE_ADDR,
      opBNB_mainnet: process.env.TREASURE_ADDR,
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
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 10143,
    },
    agld_testnet: {
      url: "https://rpc-devnet.adventurelayer.xyz",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 242070,
    },
    opBNB_mainnet: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      accounts: [process.env.DEPLOY_PRIVATE_KEY],
      chainId: 204,
    },
  },
  gasReporter: {
    enabled: true,
  },
};
