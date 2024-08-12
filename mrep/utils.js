const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { Parser } = require("json2csv");
const fileNo = 2;
const lastDateRange = 1721327400;

const formulas = {
  swapTxScore: (volWeight, fP) => volWeight * (1 + 0.009 * fP),
  bridgeTxScore: (volWeight, crossChainScore) =>
    volWeight * (1 + crossChainScore),
  crossChainScore: (angleInRadians) => 0.5 * Math.sin(angleInRadians) + 1,
  freqScore: (Wfreq, D, txnCnt, medianFreq, mxTxnsPerDay) =>
    parseFloat(Wfreq) * (txnsPerDay(txnCnt, D) / medianFreq),
  explorationScore: (Wexploration, uniqContracts, totalContracts) =>
    parseFloat(Wexploration) *
    (parseFloat(uniqContracts) / parseFloat(totalContracts)),
  favScore: (Wfav, favTxnCnt, totalTxn) =>
    parseFloat(Wfav) * (parseFloat(favTxnCnt) / parseFloat(totalTxn)),
  ageScore: (Wage, userAge, medianAge) =>
    parseFloat(Wage) * (parseFloat(userAge) / parseFloat(medianAge)),
  platformDiversity: (p) => 2 * (1 - Math.pow(0.04 * p + 1, -2)),
  tokenActiveScore: (volWeight, platformDiversity) =>
    volWeight * (1 + platformDiversity),
};

const getInputData = () => {
  return new Promise((resolve, reject) => {
    const users = {};

    fs.createReadStream(path.join(__dirname, "data", `data2.csv`))
      .pipe(csv())
      .on("data", (data) => {
        if (data.tx_to?.startsWith("0x") || data.tx_from?.startsWith("0x")) {
          data.block_date = new Date(data.block_date);

          // group all txns by user ( tx_from )
          const fromAddr = data.tx_from?.toLowerCase() || "anon";
          users[fromAddr]
            ? users[fromAddr].push(data)
            : (users[fromAddr] = [data]);
        }
      })
      .on("end", () => {
        // sort by increasing block_date
        const userAddr = Object.keys(users);
        userAddr.forEach((fromAddr) =>
          users[fromAddr].sort((a, b) => a.block_date - b.block_date)
        );

        resolve(users);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const writeOutput = (output) => {
  return new Promise((resolve, reject) => {
    const jsonString = JSON.stringify(output, null, 2);

    fs.writeFile(
      path.join(__dirname, "data", `outputData3.json`),
      jsonString,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve("File successfully written");
        }
      }
    );
  });
};

const getVolWeight = (amount_usd) => {
  let volWeight = amount_usd / 100;
  volWeight = parseFloat(volWeight.toFixed(9));
  return volWeight;
};

const getDaysInBtw = (startDate, endDate) => {
  const diffInMs = endDate - startDate;
  return Math.floor(diffInMs / (24 * 60 * 60 * 1000));
};

const sigmoid = (x, mean) => {
  const c1 = 0.0005;
  const c2 = mean;
  const val =
    10000 / (1 + Math.exp(-1 * c1 * (x - c2))) -
    10000 / (1 + Math.exp(c1 * c2));
  return val;
};

function writeToCsv(arr) {
  return new Promise((resolve, reject) => {
    const parser = new Parser();
    const csv = parser.parse(arr);

    fs.writeFile(path.join(__dirname, "data", "output2.csv"), csv, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve("CSV file successfully written");
      }
    });
  });
}

const getArrMedian = (arr) => {
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);

  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
};

const getUniqueContracts = (txns) => {
  const uniqueContracts = new Set();
  txns.forEach((txn) => uniqueContracts.add(txn.tx_to));

  return uniqueContracts.size;
};

const getUnixTimeInSec = (dateString) => {
  const dateObject = new Date(dateString);
  return Math.floor(dateObject.getTime() / 1000);
};

const getAgeInDays = (dateString) => {
  const startTime = 1689379200; // 15th July 2023
  const currTime = getUnixTimeInSec(dateString);

  const ageInDays = (currTime - startTime) / (24 * 60 * 60);
  return ageInDays;
};

const contracts = [
  "0x82ac2ce43e33683c58be4cdc40975e73aa50f459",
  "0xe592427a0aece92de3edee1f18e0157c05861564",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  "0x7bc4e2c32af545abdcb6e12cd664a71ae46d495a",
  "0x7aeef1035ba6794c0478718a2330671ec8802af1",
  "0xffa51a5ec855f8e38dd867ba503c454d8bbc5ab9",
  "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
  "0xc30141b657f4216252dc59af2e7cdb9d8792e1b0",
  "0x1111111254760f7ab3f16433eea9304126dcd199",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
];

const txnsPerDay = (txnCnt, D) => {
  return parseFloat(txnCnt) / parseFloat(D);
};

const getMxTxnsPerDay = (users, D) => {
  let mx = 0;

  const userAddr = Object.keys(users);
  userAddr.forEach((fromAddr) => {
    const txnCnt = users[fromAddr].length;
    mx = Math.max(mx, txnsPerDay(txnCnt, D));
  });

  return mx;
};

const isInTimeRange = (dateString, D) => {
  const time = getUnixTimeInSec(dateString);
  const startDateRange = lastDateRange - D * 24 * 60 * 60;
  return startDateRange <= time && time <= lastDateRange;
};

const getRangeTxnsForUsers = (users, D) => {
  const newUsers = {};

  const userAddr = Object.keys(users);
  userAddr.forEach((fromAddr) => {
    const arr = users[fromAddr].filter((txn) =>
      isInTimeRange(txn.block_date, D)
    );

    if (arr.length) newUsers[fromAddr] = arr;
  });

  return newUsers;
};

const parseDate = (date) => {
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
};

module.exports = {
  formulas,
  getInputData,
  getVolWeight,
  writeOutput,
  getDaysInBtw,
  sigmoid,
  writeToCsv,
  getArrMedian,
  getUniqueContracts,
  getAgeInDays,
  contracts,
  txnsPerDay,
  getMxTxnsPerDay,
  getUnixTimeInSec,
  getRangeTxnsForUsers,
  parseDate,
};
