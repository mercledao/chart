const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { Parser } = require("json2csv");
const fileNo = 2;

const formulas = {
  swapTxScore: (volWeight, fP, tD) => volWeight * (1 + 0.001 * fP + 0.009 * tD),
  bridgeTxScore: (volWeight, crossChainScore) =>
    volWeight * (1 + crossChainScore),
  crossChainScore: (angleInRadians) => 0.5 * Math.sin(angleInRadians) + 1,
  freqScore: (Wfreq, D, txnCnt) =>
    parseFloat(Wfreq) * (parseFloat(D) / parseFloat(txnCnt)),
  explorationScore: (Wexploration, uniqContracts, totalContracts) =>
    parseFloat(Wexploration) *
    (parseFloat(uniqContracts) / parseFloat(totalContracts)),
  favScore: (Wfav, favTxnCnt, totalTxn) =>
    parseFloat(Wfav) * (parseFloat(favTxnCnt) / parseFloat(totalTxn)),
  ageScore: (Wage, userAge, medianAge) =>
    parseFloat(Wage) * (parseFloat(userAge) / parseFloat(medianAge)),
};

const getInputData = () => {
  return new Promise((resolve, reject) => {
    const users = {};

    fs.createReadStream(path.join(__dirname, "data", `output2.csv`))
      .pipe(csv())
      .on("data", (data) => {
        if (data.tx_to?.startsWith("0x")) {
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
  let volWeight = amount_usd / 10;
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
  const val = 10000 / (1 + Math.exp(-1 * c1 * (x - c2)));
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

const getDuration = () => {
  const D = 120;
  return D;
};

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

module.exports = {
  formulas,
  getInputData,
  getVolWeight,
  writeOutput,
  getDaysInBtw,
  sigmoid,
  writeToCsv,
  getDuration,
  getArrMedian,
  getUniqueContracts,
  getUnixTimeInSec,
  contracts,
};
