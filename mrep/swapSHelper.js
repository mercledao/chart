const { formulas, getInputData, getVolWeight, writeOutput, getDaysInBtw } = require('./utils');

const arrFS = [];

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

    let tD = 20 * Math.log10(T);
    tD = parseFloat(tD.toFixed(9));

    res.diversityS = tD;
    res.freqPower = fP;

    const score = formulas.swapTxScore(volWeight, fP, tD);
    return parseFloat(score.toFixed(9));
};

const swapS = (txns) => {
    const output = [];
    const res = {
        totalVolume: 0,
        firstLastDays: getDaysInBtw(txns[0]?.block_date, txns[txns.length - 1]?.block_date),
    };
    const uniqueTokens = new Set();

    for (let i = 0; i < txns.length; i++) {
        const D = i > 0 ? getDaysInBtw(txns[i - 1].block_date, txns[i].block_date) : 0;
        const x = parseFloat(txns[i].amount_usd || 0);
        res.totalVolume += x;

        if (txns[i].token_bought_symbol?.length) uniqueTokens.add(txns[i].token_bought_symbol);

        if (txns[i].token_sold_symbol?.length) uniqueTokens.add(txns[i].token_sold_symbol);

        const T = uniqueTokens.size;

        output.push(getSwapTxScore(x, D, T, res));
    }

    res.swapS = output.reduce((accu, curr) => (accu += curr), parseFloat(0));
    res.totalTx = txns.length;
    res.averageVol = res.totalVolume / parseFloat(res.totalTx);
    return res;
};

const getSwapForAllUsers = async () => {
    try {
        const users = await getInputData();
        const output = [];

        // calculate
        const userAddr = Object.keys(users);
        userAddr.forEach((fromAddr) => {
            const swapScore = swapS(users[fromAddr]);
            output.push({
                user: fromAddr,
                result: swapScore,
            });
        });

        await writeOutput(output);
        console.log('Swap scores calculated successfully.');
    } catch (err) {
        console.error('Err getting swap score.', err);
    }
};

getSwapForAllUsers();
