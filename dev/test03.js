const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();
const preBlockHash = '6B86B2AA22F1D49C01E52DDB7875B4B'
const curBlockData = [{
    amount: 100,
    sender:'JOHN',
    recipient:'TOM',
}];
const nonce =100;
console.log(bitcoin.hashBlock(preBlockHash,curBlockData,nonce));