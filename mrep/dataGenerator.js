const { getInputData, writeToCsv, contracts, getUnixTimeInSec } = require("./utils");

const getRandomStr = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 2);
  }
  return result;
};

const generate = async () => {
  try {
    const users = await getInputData();
    const output = [];

    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      const str = getRandomStr(users[fromAddr].length);
      users[fromAddr].forEach((txn, index) => {
        txn.type = str[index] == "0" ? "deposit" : "withdraw";
        output.push(txn);
      });
    });

    await writeToCsv(output);
    console.log("Test data generated.");
  } catch (err) {
    console.error("Err generating test data.", err);
  }
};

const stickyGenerator = async () => {
  try {
    const users = await getInputData();
    const output = [];

    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      users[fromAddr].forEach((txn) => {
        txn.tx_to = contracts[Math.floor(Math.random() * 10)];
        output.push(txn);
      });
    });

    await writeToCsv(output);
    console.log("Test data generated.");
  } catch (err) {
    console.error("Err generating test data.", err);
  }
};

stickyGenerator();
