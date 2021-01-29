//파일 수정시에 자동으로 서버 재실행하는 모듈 => nodemon
//express모듈 import
const express = require('express'); 
var app = new express();

//blockchain 포함
const Blockchain = require('./Blockchain');
var bitcoin = new Blockchain();

//채굴자 보상하려면 주소필요한 임의로 아이디 지정하기 위한 uuid사용
const {v1:uuid} = require('uuid');
var nodeAddress = uuid().split('-').join('');

//body parser:엔드포인트 데이터 전송 형태 json을 처리할 수 있는 라이브러리임
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
app.get('/transaction',function(req,res){
    const blockindex = bitcoin.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
    )
    res.json({note: `Transaction will be added in block ${blockindex}.`});
}); 

 //새로운 블록 채굴
app.get('/mine',function(req,res){
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

    //새로운 블록을 다른 노드들에게 통지
    res.json({note:"New block mined successfully",block: newBlock});

    //새로운 블록을 채굴한 것에 대한 보상 처리 => 채굴한 사람의 주소를 알아야한다. 
    //여기서는 npm을 이용해서 네트워크 아이디를 임의로 지정해줘서 보상 진행! => uuid사용(범용 고유 식별자)
    //2018년 기준 보상은 12.5btc, sender가 "00"이면 보상의 의미
    bitcoin.createNewTransaction(12.5,"reward00",nodeAddress); //=>보상에 대한 트랜잭션은 다음 블록에 기록됨
});  

//웹브라우저 주소창에서 입력 후 실행
app.listen(3000,()=>{
    console.log('listening on port 3000')
});