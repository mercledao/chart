const {
  formulas,
  getInputData,
  writeOutput,
  getArrMedian,
  getUniqueContracts,
  contracts,
  txnsPerDay,
  getMxTxnsPerDay,
  getAgeInDays,
} = require("./utils");

const getMedianFreq = (users, D) => {
  const userAddr = Object.keys(users);
  const userFreq = [];

  userAddr.forEach((fromAddr) => {
    const txnCnt = users[fromAddr].length;
    userFreq.push(txnsPerDay(txnCnt, D));
  });

  return getArrMedian(userFreq);
};

const getMedianAge = (users) => {
  const userAddr = Object.keys(users);
  const userAges = [];

  userAddr.forEach((fromAddr) => {
    userAges.push(getAgeInDays(users[fromAddr][0].block_date));
  });

  return getArrMedian(userAges);
};

const getFavContract = (txns) => {
  const frequencyMap = new Map();
  let maxFrequency = 0;

  // Count the frequency of each tx_to addr
  txns.forEach((txn) => {
    frequencyMap.set(txn.tx_to, (frequencyMap.get(txn.tx_to) || 0) + 1);
    maxFrequency = Math.max(maxFrequency, frequencyMap.get(txn.tx_to));
  });

  return maxFrequency;
};

const stickyS = (txns, medianAge, medianFreq, D, mxTxnsPerDay) => {
  const Wfreq = 25;
  const Wexploration = 25;
  const Wfav = 25;
  const Wage = 25;
  const totalContracts = contracts.length;
  const uniqueContracts = getUniqueContracts(txns);
  const favTxnCnt = getFavContract(txns);
  const userAge = getAgeInDays(txns[0].block_date);

  const res = {
    totalTx: txns.length,
    freqScore: formulas.freqScore(Wfreq, D, txns.length, medianFreq, mxTxnsPerDay),
    explorationScore: formulas.explorationScore(
      Wexploration,
      uniqueContracts,
      totalContracts
    ),
    favScore: formulas.favScore(Wfav, favTxnCnt, txns.length),
    ageScore: formulas.ageScore(Wage, userAge, medianAge),
    userAge,
    favTxnCnt,
    uniqueContracts,
  };

  res.stickyScore =
    res.freqScore + res.explorationScore + res.favScore + res.ageScore;
  return res;
};

const getStickySForAllUsers = async () => {
  try {
    const users = await getInputData();
    const output = [];
    const medianAge = getMedianAge(users);
    const D = 7;
    const medianFreq = getMedianFreq(users, D);
    const mxTxnsPerDay = getMxTxnsPerDay(users, D);

    console.log(` medianAge: ${medianAge}\n medianFreq: ${medianFreq}`);

    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      const stickyObj = stickyS(users[fromAddr], medianAge, medianFreq, D, mxTxnsPerDay);

      output.push({
        user: fromAddr,
        result: stickyObj,
      });
    });

    await writeOutput(output);
    console.log("Sticky scores calculated successfully.");
  } catch (err) {
    console.error("Err getting sticky score.", err);
  }
};

getStickySForAllUsers();
