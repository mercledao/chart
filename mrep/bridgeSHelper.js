const {
  formulas,
  getInputData,
  writeOutput,
  getVolWeight,
  getDaysInBtw,
} = require("./utils");

let matrix = {};

const getAngleInRadians = (src, dest) => {
  const srcArr = Object.keys(matrix[src])?.map((key) => matrix[src][key]);

  // scaling
  const mn = Math.min(...srcArr);
  const mx = Math.max(...srcArr);
  const delta = Math.max(mx - mn, 1); // soup denom can be 0!

  // combined scaled(x) + ( PI / 2 )
  const angle =
    (parseFloat(4 * matrix[src][dest] + 1) * Math.PI) / parseFloat(2 * delta);
  return angle;
};

const getBridgeTxScore = (x, src, dest) => {
  const volWeight = getVolWeight(x);
  const angleInRadians = getAngleInRadians(src, dest);
  const crossChainScore = formulas.crossChainScore(angleInRadians);

  const res = formulas.bridgeTxScore(volWeight, crossChainScore);
  return parseFloat(res.toFixed(9));
};

const bridgeS = (txns) => {
  matrix = {};
  const output = [];
  const res = {
    totalVolume: 0,
    firstLastDays: getDaysInBtw(
      txns[0]?.block_date,
      txns[txns.length - 1]?.block_date
    ),
  };

  for (let i = 0; i < txns.length; i++) {
    if (
      !txns[i].token_bought_symbol?.length ||
      !txns[i].token_sold_symbol?.length
    )
      continue;

    const x = parseFloat(txns[i].amount_usd || 0);
    res.totalVolume += x;

    // soup use actual chainId's
    const src = txns[i].token_bought_symbol;
    const dest = txns[i].token_sold_symbol;

    if (!matrix[src]) matrix[src] = {};
    if (!matrix[src][dest]) matrix[src][dest] = 0;

    output.push(getBridgeTxScore(x, src, dest));

    matrix[src][dest]++;
  }

  res.bridgeS = output.reduce((accu, curr) => (accu += curr), parseFloat(0));
  res.totalTx = txns.length;
  res.averageVol = res.totalVolume / parseFloat(res.totalTx);
  res.matrix = matrix;
  return res;
};

const getBridgeForAllUsers = async () => {
  try {
    const users = await getInputData();
    const output = [];

    // calculate
    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      const bridgeScore = bridgeS(users[fromAddr]);
      output.push({
        user: fromAddr,
        result: bridgeScore,
      });
    });

    await writeOutput(output);
    console.log("Bridge scores calculated successfully.");
  } catch (err) {
    console.error("Err getting Bridge score.", err);
  }
};

getBridgeForAllUsers();
