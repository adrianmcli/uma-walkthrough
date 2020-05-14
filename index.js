require("dotenv").config();
const { ethers } = require("ethers");
const Ganache = require("ganache-core");
const uma = require("@studydefi/money-legos/uma");

const kovanAddresses = require("./kovanAddresses.json");
const nodeUrl = process.env.KOVAN_NODE_URL;
const privKey = process.env.PRIV_KEY;

const main = async () => {
  // fork from kovan
  const ganache = Ganache.provider({
    fork: nodeUrl,
    network_id: 42,
    accounts: [
      {
        secretKey: privKey,
        balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
      },
    ],
  });

  // setup Ethers.js wallet
  const provider = new ethers.providers.Web3Provider(ganache);
  const wallet = new ethers.Wallet(privKey, provider);

  // instantiate empCreator
  const empCreator = new ethers.Contract(
    kovanAddresses.ExpiringMultiPartyCreator,
    uma.expiringMultiPartyCreator.abi,
    wallet,
  );

  // get collateral whitelist
  const collateralWhitelistAddress = await empCreator.collateralTokenWhitelist();
  const collateralTokenWhitelist = new ethers.Contract(
    collateralWhitelistAddress,
    uma.addressWhitelist.abi,
    wallet,
  );

  // check if TestnetERC20 and WETH9 are supported as collateral
  const TestnetERC20Supported = await collateralTokenWhitelist.isOnWhitelist(
    kovanAddresses.TestnetERC20,
  );
  const WETH9Supported = await collateralTokenWhitelist.isOnWhitelist(
    kovanAddresses.WETH9,
  );
  console.log("TestnetERC20 collateral supported", TestnetERC20Supported);
  console.log("WETH9 collateral supported", WETH9Supported);

  // EMP / token factory parameters
  const constructorParams = {
    expirationTimestamp: "1619827200",
    collateralAddress: kovanAddresses.TestnetERC20,
    priceFeedIdentifier: ethers.utils.formatBytes32String("UMATEST"),
    syntheticName: "Test UMA Token",
    syntheticSymbol: "UMATEST",
    collateralRequirement: { rawValue: ethers.utils.parseEther("1.5") },
    disputeBondPct: { rawValue: ethers.utils.parseEther("0.1") },
    sponsorDisputeRewardPct: { rawValue: ethers.utils.parseEther("0.1") },
    disputerDisputeRewardPct: { rawValue: ethers.utils.parseEther("0.1") },
    minSponsorTokens: { rawValue: "100000000000000" },
    timerAddress: "0x0000000000000000000000000000000000000000",
  };

  // check if price identifier is supported
  const identifierWhitelist = new ethers.Contract(
    kovanAddresses.IdentifierWhitelist,
    uma.identifierWhitelist.abi,
    wallet,
  );
  const identifierSupported = await identifierWhitelist.isIdentifierSupported(
    constructorParams.priceFeedIdentifier,
  );
  console.log("UMATEST identifier supported", identifierSupported);

  // bump gas price and limit
  const gasPrice = await wallet.provider.getGasPrice();
  const txOpts = {
    gasPrice: gasPrice.mul(110).div(100),
    gasLimit: 4000000,
  };

  // attempt creation of EMP
  const tx = await empCreator.createExpiringMultiParty(
    constructorParams,
    txOpts,
  );
  console.log(tx);
};

main();
