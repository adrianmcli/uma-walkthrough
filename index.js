require("dotenv").config();
const { ethers } = require("ethers");
const Ganache = require("ganache-core");
const uma = require("@studydefi/money-legos/uma");
const erc20 = require("@studydefi/money-legos/erc20");

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

  // create EMP
  const tx = await empCreator.createExpiringMultiParty(constructorParams, {
    gasLimit: 6000000, // this is very important
  });
  await tx.wait();
  const receipt = await wallet.provider.getTransactionReceipt(tx.hash);
  const empAddress = receipt.logs[0].address;
  console.log("empAddress", empAddress);

  const emp = new ethers.Contract(
    empAddress,
    uma.expiringMultiParty.abi,
    wallet,
  );

  const collateralToken = new ethers.Contract(
    kovanAddresses.TestnetERC20,
    uma.testnetERC20.abi,
    wallet,
  );

  // allocate 10000 collateral tokens to myself
  await collateralToken.allocateTo(
    wallet.address,
    ethers.utils.parseEther("10000"),
  );
  await collateralToken.approve(emp.address, ethers.utils.parseEther("10000"));
  console.log("10000 collateral tokens allocated to myself");

  const gasPrice = await wallet.provider.getGasPrice();
  const tx1 = await emp.create(
    { rawValue: ethers.utils.parseEther("150") },
    { rawValue: ethers.utils.parseEther("100") },
    { gasPrice: gasPrice.mul(110).div(100), gasLimit: 6500000 },
  );

  console.log(tx1);

  const tokenCurrency = await emp.tokenCurrency();
  console.log(tokenCurrency);
};

main();
