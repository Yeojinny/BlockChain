const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();

const bc1 = {
    "chain": [
        {
            "index": 1,
            "timestamp": 1611816988778,
            "transactions": [],
            "nonce": 100,
            "hash": "0",
            "prevBlockHash": "0"
        },
        {
            "index": 2,
            "timestamp": 1611817008744,
            "transactions": [
                {
                    "amount": 300,
                    "sender": "Ji",
                    "recipient": "Yeojin",
                    "transactionId": "fa4e2b80613511ebb5842947d190ca03"
                }
            ],
            "nonce": 122303,
            "hash": "00002a6272cd839b7664cde598a0394745e440c1a1087e3fd7beb71cbec09cc4",
            "prevBlockHash": "0"
        }
    ],
    "newTransactions": [
        {
            "amount": 12.5,
            "sender": "00",
            "recipient": "f2186ca0613511ebb5842947d190ca03",
            "transactionId": "fe014870613511ebb5842947d190ca03"
        }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": [
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004"
    ]
};
console.log('Valid:',bitcoin.chainIsValid(bc1.chain));