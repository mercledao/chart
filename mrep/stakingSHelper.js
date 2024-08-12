const { formulas, getInputData, writeOutput, getDaysInBtw, parseDate } = require('./utils');
const ETH_PRICE = 3500;

const getResult = (txns, maxDate) => {
    let curr = txns[0].block_date;
    const end = maxDate;
    const difference = getDaysInBtw(curr, end);

    let currDateString = parseDate(curr);

    let score = 0;

    const balanceMap = new Map();
    let absVolume = 0;
    let activeBalance = 0;
    let volDeposited = 0;
    let volWithdrawn = 0;

    let currTd = 0;

    do {
        for (const txn of txns) {
            if (parseDate(txn.block_date) !== currDateString) continue;
            balanceMap.set(txn.token, (+balanceMap.get(txn.token) || 0) + +txn.amount);

            if (
                !txn.token.toLowerCase().includes('eth') &&
                !txn.token.toLowerCase().includes('stone')
            ) {
                console.error('Missing price for :', txn.token);
                continue;
            }
            absVolume += Math.abs(+txn.amount * ETH_PRICE);
            activeBalance += +txn.amount * ETH_PRICE;

            if (+txn.amount < 0) {
                volWithdrawn += Math.abs(+txn.amount * ETH_PRICE);
            } else {
                volDeposited += +txn.amount * ETH_PRICE;
            }
        }

        const keys = Array.from(balanceMap.keys());
        for (const token of keys) {
            if (!token.toLowerCase().includes('eth') && !token.toLowerCase().includes('stone')) {
                console.error('Missing price for :', token);
                continue;
            }
            const volWeight = (balanceMap.get(token) * ETH_PRICE || 0) / 10;
            const platformDiversity = formulas.platformDiversity(keys.length);

            score += formulas.tokenActiveScore(volWeight, platformDiversity);
            currTd = platformDiversity;
        }

        curr = new Date(+curr + (24 * 60 * 60 * 1000));
        currDateString = parseDate(curr);
    } while (+curr <= +end);

    return {
        days: difference,
        volDeposited: volDeposited,
        volWithdrawn: volWithdrawn,
        txnCount: txns.length,
        tokenDiversity: currTd,
        volume: absVolume,
        balance: activeBalance,
        stakingS: score,
    };
};

const getStakeScoreForUser = async () => {
    try {
        const userTxns = await getInputData();
        let allTxns = Object.values(userTxns);

        let maxDate = 0;

        allTxns.forEach((txns) => {
            Object.values(txns).forEach((txn) => {
                maxDate = Math.max(+txn?.block_date || 0, maxDate);
            });
        });

        const output = [];

        // calculate
        const userAddr = Object.keys(userTxns);
        userAddr.forEach((fromAddr) => {
            const result = getResult(userTxns[fromAddr], new Date(maxDate));
            output.push({
                user: fromAddr,
                result: result,
            });
        });

        await writeOutput(output);
        console.log("Staking scores calculated successfully.");
    } catch (err) {
        console.error('Err getting staking score.', err);
    }
};

getStakeScoreForUser();
