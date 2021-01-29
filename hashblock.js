const Blockchain = require('./dev/Blockchain');
var bitcoin = new Blockchain();

const bc1 = {
    "chain": [
    {
        "index": 1,
        "timestamp": 1611727956295,
        "transactions": [],
        "nonce": 100,
        "hash": "0",
        "prevBlockHash": "0"
    },
    {
        "index": 2,
        "timestamp": 1611727996981,
        "transactions": [
            {
            "amount": 200,
            "sender": "Kim",
            "recipient": "lin",
            "transactionId": "bb791f20606611ebb7b0456e126a7629"
            }
        ],
        "nonce": 41059,
        "hash": "0000373c9e630d01940f9bf4488d06a0f4a8d3d4fdea092a004b7179480fd4e4",
        "prevBlockHash": "0"
    },
    {
        "index": 3,
        "timestamp": 1611728004218,
        "transactions": [
        {
        "amount": 12.5,
        "sender": "00",
        "recipient": "a699a570606611ebb7b0456e126a7629",
        "transactionId": "bedf0670606611ebb7b0456e126a7629"
        },
        {
        "amount": 200,
        "sender": "Kim",
        "recipient": "lin",
        "transactionId": "c0521e70606611ebb7b0456e126a7629"
        }
        ],
        "nonce": 55415,
        "hash": "0000e7f8e8e4fed07e10c38766f781a101f4daa3587c0ce12b358eb80154e4e3",
        "prevBlockHash": "0000373c9e630d01940f9bf4488d06a0f4a8d3d4fdea092a004b7179480fd4e4"
    },
    {
        "index": 4,
        "timestamp": 1611728009006,
        "transactions": [
        {
        "amount": 12.5,
        "sender": "00",
        "recipient": "a699a570606611ebb7b0456e126a7629",
        "transactionId": "c32ae0f0606611ebb7b0456e126a7629"
        },
        {
        "amount": 200,
        "sender": "Kim",
        "recipient": "lin",
        "transactionId": "c41b8280606611ebb7b0456e126a7629"
        }
        ],
        "nonce": 25019,
        "hash": "000084b65d1858ff1056378723991c9549e4f31592886f9ffc6780d3a1fd2d4f",
        "prevBlockHash": "0000e7f8e8e4fed07e10c38766f781a101f4daa3587c0ce12b358eb80154e4e3"
    }
    ]   
};

function test() {
    const dddd=bc1.chain;
    for(var i=1;i<dddd.length;i++)
    {
        const currentBlock = dddd[i];
        const prevBlock = dddd[i-1];
        const preBlockHash=prevBlock['hash'];
        const curBlockData= {transaction: currentBlock['transactions'],index:currentBlock['index']};
        const nonce=currentBlock['nonce'];

        console.log('preBlockHash:'+preBlockHash);
        console.log('curBlockData:'+curBlockData);
        console.log('nonce:'+nonce);
        console.log('----------------------------------------');

        const blockHash = bitcoin.hashBlock(prevBlock['hash'],
            {transaction: currentBlock['transactions'],index:currentBlock['index']},
            currentBlock['nonce']);

        console.log('blockHash:'+blockHash);
        console.log('=========================================');
    
        if(blockHash.substring(0,4)!=='0000'){
            console.log('a:',blockHash)
            validChain = false;
        }
    }
}

test();