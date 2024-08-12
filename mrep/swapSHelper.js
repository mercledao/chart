const {
  formulas,
  getInputData,
  getVolWeight,
  writeOutput,
  getDaysInBtw,
  sigmoid,
} = require("./utils");

let arrFS = [];

const getFS = (D) => {
  const weightD = -0.1;
  const weightedD = D * weightD;

  const expo = Math.exp(weightedD);
  const res = 100 * expo;

  arrFS.push(res);
  return res;
};

const getFP = (D) => {
  getFS(D);
  const sumFreqS = arrFS.reduce((accu, curr) => (accu += curr), 0);
  const avgFreqS = sumFreqS / arrFS.length;
  return parseFloat(avgFreqS.toFixed(8));
};

const getSwapTxScore = (x, D, T, res) => {
  const volWeight = getVolWeight(x);
  const fP = getFP(D);

  res.freqPower = fP;

  const score = formulas.swapTxScore(volWeight, fP);
  return parseFloat(score.toFixed(9));
};

const getSwapS = (txns) => {
  arrFS = [];
  const swapTxScores = [];
  const res = {
    totalVolume: 0,
    firstLastDays: getDaysInBtw(
      txns[0]?.block_date,
      txns[txns.length - 1]?.block_date
    ),
  };
  const uniqueTokens = new Set();

  for (let i = 0; i < txns.length; i++) {
    const D =
      i > 0 ? getDaysInBtw(txns[i - 1].block_date, txns[i].block_date) : 0;
    const x = parseFloat(txns[i].amount_usd || 0);
    res.totalVolume += x;

    if (txns[i].token_bought_symbol?.length)
      uniqueTokens.add(txns[i].token_bought_symbol);

    if (txns[i].token_sold_symbol?.length)
      uniqueTokens.add(txns[i].token_sold_symbol);

    const T = uniqueTokens.size;

    swapTxScores.push(getSwapTxScore(x, D, T, res));
  }

  res.swapScoreRaw = swapTxScores.reduce((accu, curr) => (accu += curr), 0);
  res.totalTx = txns.length;
  res.averageVol = res.totalVolume / parseFloat(res.totalTx);
  return res;
};

const getSwapForAllUsers = async () => {
  try {
    const users = await getInputData();
    const output = [];
    let mean = 0;

    // calculate
    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      const res = getSwapS(users[fromAddr]);

      // todo cap only 100k & below r included
      if (res.swapScoreRaw > 0 && res.swapScoreRaw < 100000) {
        output.push({
          user: fromAddr,
          result: res,
        });
        mean += res.swapScoreRaw;
      }
    });

    mean = mean / parseFloat(output.length);
    console.log("mean = ", mean);
    let meanDev = 0;

    output.forEach((i) => {
      const dev = Math.abs(i.result.swapScoreRaw - mean);
      meanDev += dev;
      i.result.meanDeviation = dev;
      i.result.swapS = sigmoid(i.result.swapScoreRaw, mean);
    });

    meanDev = meanDev / parseFloat(output.length);
    console.log("meanDeviation = ", meanDev);

    await writeOutput(output);
    console.log("Swap scores calculated successfully.");
  } catch (err) {
    console.error("Err getting swap score.", err);
  }
};

getSwapForAllUsers();
