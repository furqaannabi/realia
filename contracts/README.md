# Realia Smart Contracts

This directory contains the smart contracts for the Realia platform, built with Hardhat 3.

## Configuration Values

### Current (Hackathon Demo)
- **REQUIRED_VERIFICATIONS**: 2
- **MINT_PRICE**: 1 PYUSD
- **VERIFY_PRICE**: 0.05 PYUSD
- **MIN_AGENT_STAKING**: 0.05 PYUSD

### Post-Hackathon Production Values
- **REQUIRED_VERIFICATIONS**: 5
- **MINT_PRICE**: 5 PYUSD
- **VERIFY_PRICE**: 0.5 PYUSD
- **MIN_AGENT_STAKING**: 500 PYUSD

## Project Overview

This project includes:

- RealiaFactory and RealiaNFT smart contracts
- A simple Hardhat configuration file
- Foundry-compatible Solidity unit tests
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/)
- Examples demonstrating how to connect to different types of networks

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
