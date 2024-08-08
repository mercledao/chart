const { getInputData, writeToCsv, getDuration, contracts } = require("./utils");

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

function getRandomDate(startDate, maxDays) {
  // Convert start date to timestamp
  const startTimestamp = startDate.getTime();

  // Calculate the maximum timestamp within the range
  const endTimestamp = startTimestamp + maxDays * 24 * 60 * 60 * 1000;

  // Generate a random timestamp between the start and end timestamps
  const randomTimestamp =
    startTimestamp + Math.random() * (endTimestamp - startTimestamp);

  // Convert the random timestamp back to a Date object
  const randomDate = new Date(randomTimestamp);

  // Format the date as YYYY-MM-DD
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, "0");
  const day = String(randomDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const stickyGenerator = async () => {
  try {
    const users = await getInputData();
    const output = [];
    const startDate = new Date("2023-07-15");
    const maxDays = getDuration();

    const userAddr = Object.keys(users);
    userAddr.forEach((fromAddr) => {
      users[fromAddr].forEach((txn, index) => {
        txn.tx_from = Math.floor(Math.random() * 3000) + 1;
        txn.tx_to = contracts[Math.floor(Math.random() * 10)];
        txn.block_date = getRandomDate(startDate, maxDays);
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
