# Monad Experience Event
### Run tests

```
npx hardhat test
```

### Deploy

```
npx hardhat deploy --network <network> --reset --tags <contract tags>
```

### Verify contracts

```
npx hardhat --network mainnet sourcify
```

### File .env

```
DEPLOY_PRIVATE_KEY=<Private key of the deploying account>
MANAGER_ADDR=<Manager Address>
TREASURE_ADDR=<Treasure Wallet Address>
DAILY_SPIN_LIMIT=<Daily Spin limit>
LIMIT_PER_ADDR=<Spin Limit per address>
FEE=<fee per transaction>
```

_Make sure correct file .env localtion in hardhat.config.js_
