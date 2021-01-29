const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();
const preBlockHash = '6B86B2AA22F1D49C01E52DDB7875B4B'
const curBlockData = [
    { amount:100, sender:'JSON', recipient:'TOM'},
    { amount:50, sender:'TOM', recipient:'JANE'},
    { amount:10, sender:'JANE', recipient:'JOHN'},
];
console.log(bitcoin.proofOfWork(preBlockHash,curBlockData));