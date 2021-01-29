//파일 수정시에 자동으로 서버 재실행하는 모듈 => nodemon
//express모듈 import
const express = require('express'); 
var app = new express();

//다른 노드에 요청을 보낼 수 있도록 해주는 라이브러리
const rp = require('request-promise');
const requestPromise = require('request-promise');

//blockchain 포함
const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();

//채굴자 보상하려면 주소필요한 임의로 아이디 지정하기 위한 uuid사용
const {v1:uuid} = require('uuid');
var nodeAddress = uuid().split('-').join('');

//body parser:엔드포인트 데이터 전송 형태 json 이를 처리할 수 있는 라이브러리임
const bodyparser = require('body-parser'); 
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

//3개의 엔드포인트 구현
app.get('/',function(req,res){res.send('hello')}); //root 
//전체 블록체인을 가지고 와서 그 안의 데이터를 조회 =>단순조회 get으로 해도됨 url로 확인시 get으로 해두어야함
app.get('/blockchain',function(req,res){
    res.send(bitcoin);
});  

//새로운 트랜잭션 생성
app.post('/transaction',function(req,res){
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}.`});
}); 


app.post('/transaction/broadcast',function(req,res){
    const newTransaction = bitcoin.createNewTransaction(
        req.body.amount,req.body.sender,req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    const requestPromise =[];
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        const requestOption = {
            uri:networkNodeUrl + '/transaction',
            method:'POST',
            body: newTransaction,
            json:true
        };
        requestPromise.push(rp(requestOption));
    });
    Promise.all(requestPromise).then(data=>{
        res.json({note:'Transaction created and broadcast successfully.'
    });
});
});


 //새로운 블록 채굴
app.post('/mine',function(req,res){
    //마지막 블록을 가져온다.
    const lastBlock = bitcoin.getLastBlock();

    //마지막 블럭의 해쉬값, 즉 이전 블럭의 해쉬값
    const preBlockHash = lastBlock['hash'];

    //현재 블럭의 데이터 : 미완료된 거래내역 + 블락의 index값
    const curBlockData = {
        transaction: bitcoin.newTransactions,
        index:lastBlock['index']+1
    };

    //이전 블럭 해쉬, 현재블럭 데이터를 proofofwork에 넣고 맞는 해쉬값을 찾고 nonce값 리턴
    const nonce = bitcoin.proofOfWork(preBlockHash,curBlockData);

    //이전 블럭 해쉬, 현재 블럭 데이터, noce값을 넣고 현재 블럭의 해쉬값 리턴
    const blockHash = bitcoin.hashBlock(preBlockHash,curBlockData,nonce);

    //nonce, 이전 블럭의 해쉬값, 현재 블록의 해쉬값을 통해 => 새로운 블록 생성!
    const newBlock = bitcoin.createNewBlock(nonce,preBlockHash,blockHash);
    const requestPromise = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOption = {
            uri : networkNodeUrl + '/receive-new-block',
            method:'POST',
            body:{newBlock:newBlock},
            json:true
        };
        requestPromise.push(rp(requestOption));
    });
    Promise.all(requestPromise)
    .then(data => {
        const requestOption = {
            uri:bitcoin.currentNodeUrl + '/transaction/broadcast',
            method:'POST',
            body:{
                amount: 12.5,
                sender:'00',
                recipient:nodeAddress
            },
            json:true
        };
        return rp(requestOption);
    })
    .then(data => {
        res.json({
            note:'New block mined & broadcast successfuly.',
            block:newBlock
        });
    });
    //새로운 블록을 다른 노드들에게 통지
    //res.json({note:"New block mined successfully",block: newBlock});

    //새로운 블록을 채굴한 것에 대한 보상 처리 => 채굴한 사람의 주소를 알아야한다. 
    //여기서는 npm을 이용해서 네트워크 아이디를 임의로 지정해줘서 보상 진행! => uuid사용(범용 고유 식별자)
    //2018년 기준 보상은 12.5btc, sender가 "00"이면 보상의 의미
    //bitcoin.createNewTransaction(12.5,"reward00",nodeAddress); //=>보상에 대한 트랜잭션은 다음 블록에 기록됨
});  

//새로운 블록을 다른 노드들이 다 받을수 있도록
app.post('/receive-new-block',function(req,res){
    console.log(req.body);
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.prevBlockHash;
    const correctIndex = lastBlock['index']+1 === newBlock['index'];

    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.newTransactions=[];
        res.json({
            note:'New block received and accepted',
            newBlock: newBlock
        });
    }
    else{
        res.json({
            note:'New block rejected',
            newBlock:newBlock
        });
    }
});





//서로 다른 포트에서 실행되도록 하기 위해 포트를 파라미터로 설정
const port = process.argv[2];
app.listen(port,function(){
    console.log(`listening on port ${port}`)
});

//새로운 노드를 등록하고 전체 네트워크에 알림
app.post('/register-and-broadcast-node',function(req,res){
    //새로 진입한 노드의 주소
    const newNodeUrl = req.body.newNodeUrl; 
    //비트코인 네트워크에 새로 진입한 노드의 주소가 없을 경우 추가
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1){
        bitcoin.networkNodes.push(newNodeUrl);
    }
    const regNodesPromises = [];
    //비트코인 네트워크에 등록된 네트워크에 새로운 노드 정보를 등록
    //console.log(bitcoin);
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        const requestOption ={
           uri:networkNodeUrl + '/register-node',
           method: 'POST',
           body :{newNodeUrl:newNodeUrl},
           json:true
        };
        //순차적으로 비동기를 실행하기 위해서 배열에 넣음
        regNodesPromises.push(rp(requestOption));
    }); //for문 끝

    //순차적으로 비동기 작업 처리
    Promise.all(regNodesPromises)
        .then(data =>{
            const bulkRegisterOption = {
                uri : newNodeUrl + '/register-nodes-bulk',
                method:'POST',
                body:{allNetworkNodes: [...bitcoin.networkNodes,bitcoin.currentNodeUrl]},
                json:true
        }
        return rp(bulkRegisterOption);       
    }).then(data=>{
        res.json({note : 'New Node registered with network successfully'});
    });
});

//네트워크에 새로운 노드 등록
app.post('/register-node',function(req,res){
    //새로운 노드 주소
    const newNodeUrl = req.body.newNodeUrl;
    console.log(newNodeUrl);
    //배열 networkNodes에 없으면 true, 있으면 false
    const nodeNotExist = (bitcoin.networkNodes.indexOf(newNodeUrl)==-1);
    //currentNodeUrl과 newNodeUrl이 다르면 true, 같다면 false
    const notCurrentNode = bitcoin.currentNodeUrl!==newNodeUrl;

    //기존에 없고, 현재 노드의 url과 다르면 추가(코인 전체 네트워크에 새로운 주소 등록)
    //console.log(nodeNotExist , notCurrentNode)
    if(nodeNotExist&&notCurrentNode)
        bitcoin.networkNodes.push(newNodeUrl);
    res.json({note:`New node registered successfully.`});
   
});

//새로운 노드에 기존의 노드 정보 등록
app.post('/register-nodes-bulk',function(req,res){
    const allNetworkNodes=req.body.allNetworkNodes;
    console.log("확인:"+allNetworkNodes);
    allNetworkNodes.forEach(networkNodeUrl=>{ //네트워크 노드 url을 loop문을 돌면서 가져와서
        const nodeNotAlreadyPresent = (bitcoin.networkNodes.indexOf(networkNodeUrl)== -1); 
        const notCurrentNode = (bitcoin.currentNodeUrl!==networkNodeUrl);   
        
        if(nodeNotAlreadyPresent && notCurrentNode) //현재 노드가 아니고 배열에도 없다면 추가!
            bitcoin.networkNodes.push(networkNodeUrl);
    });
    res.json({note:`Bulk registration successful.`});
});


app.post('/consensus',function(req,res){

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        const requestOption = {
            uri:networkNodeUrl + '/blockchain',
            method:'GET',
            json:true
        };
        requestPromises.push(rp(requestOption));
    });
    Promise.all(requestPromises)
    .then(blockchains =>{
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newTransactions =null;

        //가장 긴 블록체인을 검색
        blockchains.forEach(blockchain =>{
            if(blockchain.chain.length >maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newTransactions = blockchain.newTransactions;
            };
        });
        if(!newLongestChain || (newLongestChain&&!bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note:'Current chain has not been replaced.',
                chain: bitcoin.chain
            });
        }
        else{
             bitcoin.chain = newLongestChain;
             bitcoin.newTransactions = newTransactions;
             res.json({
                 note:'This chain has been replaced.',
                 chain:bitcoin.chain
             });
        }
    });
});

//=========특정 블록 해쉬, 트랜잭션 아이디, 주소를 통해 블록 데이터 확인============
//블록해쉬가 전송되면 해당 블록이 반환
app.get('/block/:blockHash',function(req,res){
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block:correctBlock
    });
});

app.get('/transaction/:transactionId',function(req,res){
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction:transactionData.transaction,
        block:transactionData.block
    });
});

//address가 전송되면 해당 주소와 관련된 데이터를 반환
app.get('/address/:address',function(req,res){
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressData:addressData
    });
});

//웹브라우저에서 검색할 수 있도록 하는 사용자 인터페이스 호출
app.get('/block-explorer',function(req,res){
    res.sendFile('./block-explorer/index.html',{root:__dirname});
});


