const {
  formulas,
  getInputData,
  writeOutput,
  getVolWeight,
  getDaysInBtw,
  sigmoid
} = require("./utils");

let matrix = {};

const getAngleInRadians = (src, dest) => {
  const srcArr = Object.keys(matrix[src])?.map((key) => matrix[src][key]);

  // scaling
  const mn = Math.min(...srcArr);
  const mx = Math.max(...srcArr);
  const delta = Math.max(mx - mn, 1);

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

const getBridgeS = (txns) => {
  matrix = {};
  const bridgeTxScores = [];
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

    // todo use actual chainId's
    const src = txns[i].token_bought_symbol;
    const dest = txns[i].token_sold_symbol;

    if (!matrix[src]) matrix[src] = {};
    if (!matrix[src][dest]) matrix[src][dest] = 0;

    bridgeTxScores.push(getBridgeTxScore(x, src, dest));

    matrix[src][dest]++;
  }

  res.bridgeScoreRaw = bridgeTxScores.reduce((accu, curr) => (accu += curr), 0);
  res.totalTx = txns.length;
  res.averageVol = res.totalVolume / parseFloat(res.totalTx);
  res.matrix = JSON.stringify(matrix);
  return res;
};

const getBridgeForAllUsers = async () => {
  try {
    const users = await getInputData();
    const output = [];
    let mean = 0;

    // calculate
    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      const res = getBridgeS(users[fromAddr]);
      
      // todo only 100k & below r included
      if (res.bridgeScoreRaw > 0 && res.bridgeScoreRaw < 100000) {
        output.push({
          user: fromAddr,
          result: res,
        });
        mean += res.bridgeScoreRaw;
      }
    });

    mean = mean / parseFloat(output.length);
    console.log("mean = ", mean);
    let meanDev = 0;

    output.forEach((i) => {
      const dev = Math.abs(i.result.bridgeScoreRaw - mean);
      meanDev += dev;
      i.result.meanDeviation = dev;
      i.result.bridgeS = sigmoid(i.result.bridgeScoreRaw, mean);
    });

    meanDev = meanDev / parseFloat(output.length);
    console.log("meanDeviation = ", meanDev);

    await writeOutput(output);
    console.log("Bridge scores calculated successfully.");
  } catch (err) {
    console.error("Err getting Bridge score.", err);
  }
};

getBridgeForAllUsers();
