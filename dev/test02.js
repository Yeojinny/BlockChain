const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();
//임의의 값을 파라미터로 입력
bitcoin.createNewBlock(1234,'ABCDEFGHIJK','1234567890'); //0번블록
//John이 Tom에게 100을 발신하는 트랜잭션 생성
//여러개의 트랜잭션 생성
bitcoin.createNewTransaction(100,'JOHN','TOM'); //=> 1번 블록의 트랜잭션으로 기록됨 
bitcoin.createNewTransaction(50,'TOM','JANE');
bitcoin.createNewTransaction(10,'JANE','JOHN'); 
//=> 3개의 미완료 트랜잭션은(펜딩데이터) 새로운 블록 하나 더 생성되면
// 그 새로운 블락의 트랜잭션으로 기록된다.
bitcoin.createNewBlock(5678,'ABABABABAB','A1A2AA3A4A45');
console.log(bitcoin);
console.log(bitcoin.chain[1]); //1번째 인덱스 체인 확인

