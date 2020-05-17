# UMA Standalone Walkthrough

Attempting to make a standalone walkthrough repo of UMA's basic functions.

Goals:

0. Check if collateral and price identifiers are supported
1. Create an EMP contract
2. Mint tokens from said contract
3. Redeem tokens
4. Deposit additional collateral
5. Withdraw excess collateral

## Setup

1. `npm install`
2. Make a `.env` file at project root with the following contents:

    ```
    PRIV_KEY=0x12345abcdef...
    KOVAN_NODE_URL=https://kovan.infura.io/v3/API_KEY_HERE
    ```

    Feel free to ask me for the above.
3. `npm run start-chain` starts a Ganache test-chain forked off Kovan
4. `npm run start` starts the script

## Note

Addresses inside `kovanAddresses.json` are from [here](https://github.com/UMAprotocol/protocol/blob/master/core/networks/42.json).
