### Run tests

```
npx hardhat test
```

### Deploy

```
npx hardhat run scripts/deploy.js --network <network>
```

### Verify contracts

```
npx hardhat verify --network <network> <contract address>
```

### File .env

```
DEPLOY_PRIVATE_KEY=<Private key of the deploying account>
ETHERSCAN_API_KEY=<Etherscan api key which is used for verifying contract on https://etherscan.io/>
```
