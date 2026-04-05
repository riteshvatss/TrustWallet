import { getWalletScore } from "@riteshh123/walletscore";

async function testit(wallet){
    const getit =await getWalletScore(wallet);
    console.log(new Date());
    console.log(getit);
}

testit("MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2");
