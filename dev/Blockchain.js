module.exports = Blockchain; //블록체인 생성자 함수 export를 위해 
//sha256라이브러리를 사용하기 위해 import
const sha256 = require('sha256'); 
const {v1:uuid} = require('uuid');
//현제 노드의 url
const currentNodeUrl = process.argv[3];

//블록체인 생성자 함수
function Blockchain(){
    //채굴한 모든 블록을 저장하는 배열 선언
    this.chain=[];
    //블록에 아직 저장되지 않은 모든 트랜잭션을 저장하는 배열 선언
    this.newTransactions =[];
    //node url
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    //제네시스 블록을 만들기 위해 임의의 값으로 생성
    this.createNewBlock(100,'0','0');
}


Blockchain.prototype.createNewBlock = function(nonce,prevBlockHash,hash){
    //블록체인안의 새로운 블록으로 관련 데이터들은 모두 이 안에 저장
    const newBlock ={
        index:this.chain.length+1,  //새로운 블록이 몇 번째 블록인지
        timestamp : Date.now(),     //블록이 생성된 시점
        transactions : this.newTransactions, //새로운 트랜잭션들과 미결 트랜잭션들이 추가됨
        nonce : nonce, //pow를 통해 찾아진 숫자값
        hash : hash,   //트랜잭션들의 해시값
        prevBlockHash : prevBlockHash,//이전 블록에서 직전 블록까지 트랜잭션들의 해시값
    }

    this.newTransactions = []; //새로운 블록을 만들 때 새로운 트랜잭션들을 저장할 배열을 초기화
    this.chain.push(newBlock); //새로운 블록을 체인에 추가
    return newBlock;           //새로운 블록을 반환

}

Blockchain.prototype.getLastBlock = function(){
    //체인 배열에서 제일 마지막 블록을 반환
    return this.chain[this.chain.length-1]; 
}


//블록체인에 새로운 트랜잭션을 생성함
Blockchain.prototype.createNewTransaction = function(amount,sender,recipient){
    const newTransactions = {
        amount : amount,         //송금액
        sender : sender,         //발송인 주소
        recipient : recipient,   //수신자 주소
        transactionId : uuid().split('-').join('')
    };
    return newTransactions;
}

//새로 추가할 블록의 인덱스를 반환
Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj){
    this.newTransactions.push(transactionObj);
    //this.pendingTransactions.push(transactionObj);
    return this.getLastBlock() ['index']+1;
};

//해쉬값 리턴 함수
Blockchain.prototype.hashBlock = function(preBlockHash,curBlockData,nonce){
    const dataString = preBlockHash       //3개의 파라미터를 해싱하기위해서는 하나의 스트링으로 만들어야함
        + nonce.toString()               //숫자인 nonce를 문자열로 변경
        + JSON.stringify(curBlockData);  //json데이터를 문자열로 변경
    //문자열로 만들 블록 데이터를 해싱
    const hash = sha256(dataString);
    return hash;
}

Blockchain.prototype.proofOfWork = function(preBlockHash,curBlockData){
    let nonce =0;
    let hash = this.hashBlock(preBlockHash, curBlockData,nonce);
    while(hash.substring(0,4)!=="0000"){ //문자열 자르기 0번인덱스부터 4번인덱스앞까지 즉 앞에 4개가 0000일때까지
        nonce++;
        hash = this.hashBlock(preBlockHash,curBlockData,nonce);
        process.stdout.write(hash + '\r'); //한줄로 계속 변경되면서 보여줌
    }
    process.stdout.write('\n');
    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain){
    let validChain = true;
    //모든 블록을 순회하며 직전 블록의 해쉬 함수값과 현재 블록의 해쉬값을 비교 확인
    for(var i=1;i<blockchain.length;i++){
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i-1];
        const blockHash = this.hashBlock(prevBlock['hash'],
            {transaction: currentBlock['transactions'],index:currentBlock['index']},
            currentBlock['nonce']);
        if(blockHash.substring(0,4)!=='0000'){
            validChain = false;
        }
        if(currentBlock['prevBlockHash']!==prevBlock['hash']){
            validChain = false;
        }
    };
    //최초 생성한 제네시스 블록 검증
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPrevBlockHash = genesisBlock['prevBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    //유효한 제네시스 블록을 가지고 있지 않으면
    if(!correctNonce || !correctPrevBlockHash || !correctHash || !correctTransactions)
    {
        validChain = false;
    }
    return validChain;
}

//전체 블록체인에서 특정 해시 관련 블록을 검색하는 메소드
Blockchain.prototype.getBlock = function(blockHash){
    let correctBlock = null;
    this.chain.forEach(block => {
        if(block.hash === blockHash)
            correctBlock = block;
    });
    return correctBlock;
};


//전체 블록체인에서 특정 트랜잭션을 검색하는 메소드
Blockchain.prototype.getTransaction = function(transactionId){
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach(block =>{
        block.transactions.forEach(transaction=>{
            if(transaction.transactionId === transactionId){
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
    });
    return {
        transaction: correctTransaction,
        block:correctBlock
    }; 
};


//해당 address의 거래 기록, balance조회 가능
Blockchain.prototype.getAddressData = function(address){
    const addressTransactions = [];
    this.chain.forEach(block =>{
        block.transactions.forEach(transaction =>{
            if(transaction.sender === address || transaction.recipient === address){
                addressTransactions.push(transaction);
            };
        });
    });
    let balance = 0;
    addressTransactions.forEach(transaction => {
        if(transaction.recipient === address)   balance += transaction.amount;
        else if(transaction.sender === address) balance -= transaction.amount;
    });
    return{
        addressTransactions:addressTransactions,
        addressBalance:balance
    };
};