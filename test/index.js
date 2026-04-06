import { analyzeWallet } from "@riteshh123/wallet-audit";

async function testit(wallet){
   
    const getit =await analyzeWallet(wallet);
    console.log(new Date());
    console.log(getit);
}

testit("MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2");
