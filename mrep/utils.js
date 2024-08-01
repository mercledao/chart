const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const fileNo = 3;

const formulas = {
  swapTxScore: (volWeight, fP, tD) => volWeight * (1 + 0.007 * fP + 0.003 * tD),
  bridgeTxScore: (volWeight, crossChainScore) =>
    volWeight * (1 + crossChainScore),
  crossChainScore: (angleInRadians) => 0.5 * Math.sin(angleInRadians) + 1,
};

const getInputData = () => {
  return new Promise((resolve, reject) => {
    const users = {};

    fs.createReadStream(path.join(__dirname, "data", `data${fileNo}.csv`))
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
  let volWeight = amount_usd;
  volWeight = parseFloat(volWeight.toFixed(9));
  return volWeight;
};

const getDaysInBtw = (startDate, endDate) => {
  const diffInMs = endDate - startDate;
  return Math.floor(diffInMs / (24 * 60 * 60 * 1000));
};

module.exports = {
  formulas,
  getInputData,
  getVolWeight,
  writeOutput,
  getDaysInBtw,
};
