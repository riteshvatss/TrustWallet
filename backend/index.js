import express from 'express';
import { prisma } from './lib/prisma.js';
import cors from "cors";
const app=new express();
const port=3000;

app.use(cors());

import {PublicKey, Connection,clusterApiUrl } from '@solana/web3.js';
app.use(express.json());



async function getScore(publickey) {
        
    const connection=new Connection(clusterApiUrl("devnet"),"confirmed");



    let signatureoptions={
        
        limit:1000,
        commitment:"finalized",
    }

    let wallet_Address=new PublicKey(publickey);

    let signatures=await connection.getSignaturesForAddress(wallet_Address,signatureoptions);

    let last_blockhashTime=0;
    let neweset_BlockhashTime=0;



    let config={
        commitment:"finalized",
        maxSupportedTransactionVerison:0,
    }
    let last_Signature="";

    signatures.map(signature=>{
            if(last_blockhashTime==0){
                    neweset_BlockhashTime=signature.blockTime;
            }
            last_Signature=signature.signature;
            last_blockhashTime=signature.blockTime;
        
    });
    const d = new Date();
   
    
    const wallet_age_Weeks=Math.floor((d.getTime()-(new Date(last_blockhashTime*1000)).getTime())/(1000*3600*24*7));

    const wallet_dead_from_lastWeeks=Math.floor((d.getTime()-(new Date(neweset_BlockhashTime*1000)).getTime())/(1000*3600*24*7));
    let total_transactions=0;

    const total_transaction_periodWeeks=Math.floor(((new Date(neweset_BlockhashTime*1000)).getTime()-(new Date(last_blockhashTime*1000)).getTime())/(1000*3600*24*7));
    let arr=new Array(total_transaction_periodWeeks);
    

    signatures.map(signature=>{
        let week_number=Math.floor(((new Date(neweset_BlockhashTime*1000)).getTime()-(new Date(signature.blockTime*1000)).getTime())/(1000*3600*24*7));
        total_transactions+=1;
        
       arr[week_number] = (arr[week_number] || 0) + 1;
        
    })
   
    let Wallet_weeks_Transactionhappened=0;
    let max_transaction_perweek=0;
    arr.map(val=>{
        if(val>0){
            if(val>max_transaction_perweek){
                max_transaction_perweek=val;
            }
            Wallet_weeks_Transactionhappened++;
    }})


    
   // const balance_lamports=await connection.getBalance(wallet_Address);
    const max_expected_age=52;
    const target_tx=50;
    const max_last_activeweeks=4;
    
 

    const consistency=Wallet_weeks_Transactionhappened/total_transaction_periodWeeks;
   
    const burst=max_transaction_perweek/total_transactions;
    let burst_penalty=0;
    if(burst<0.5){
            burst_penalty=0;
    }else if(burst>0.5 && burst<0.7){
        burst_penalty=5;
    }
    else{
        burst_penalty=12;
    }
    let score=(consistency*0.4)+((Math.min((wallet_age_Weeks/max_expected_age),1))*0.2)+
    ((Math.min((total_transactions/target_tx),1))*0.2)+
    ((1-Math.min((wallet_dead_from_lastWeeks/max_last_activeweeks),1))*0.1)-(burst_penalty*0.01);

    score=score*100;

    const reasons = [];

if (wallet_age_Weeks < 2) {
  reasons.push("Wallet is very new");
}

if (burst_penalty >= 5) {
  reasons.push("Suspicious burst activity detected");
}

if (wallet_dead_from_lastWeeks > 3) {
  reasons.push("Wallet inactive for long periods");
}

if (total_transactions < 10) {
  reasons.push("Very low transaction history");
}

if (consistency < 0.3) {
  reasons.push("Unstable transaction behavior");
}

    let scoreLable="";
    if(score<35){
        scoreLable="Risky";
    }else if(score<=60){
        scoreLable="Moderately Safe";
    }
    else if(score<=80){
        scoreLable="Safe"
    }
    else {
        scoreLable="Highly Safe"
    }

    let confidence="Low";
    if(total_transactions>50){
        confidence="High"
    }
    else if(total_transactions>20){
        confidence="Medium"
    }

    let info={
        last_Signature:last_Signature,
        score:Math.floor(score),
        scoreLable:scoreLable,
        reasons:reasons,
        confidence:confidence
    }

    return(info)

}

app.post("/v1/getScore",async(req,res)=>{
    try{
       
    const {wallet}=req.body;
   
    if(!wallet){
        return res.status(300).json({
            err:"wrong input"
        });
    }
    

    const check_wallet=await prisma.score.findFirst({
        where:{
            address:wallet
        }
    })

    if(check_wallet){
        const last_updatedDay=Math.floor(((new Date()).getTime()-check_wallet.date.getTime())/(1000*3600*24));

        if(last_updatedDay>=1){
                const info=await getScore(wallet);
              
               const wallet_Info= await prisma.score.update({
                    data:{
                            date:new Date(),
                            last_Signature:info.last_Signature,
                            score:info.score,
                            scoreLable:info.scoreLable,
                            reasons:info.reasons,
                            confidence:info.confidence


                    },
                    where:{
                        address:wallet
                    }
                });
              
                return res.status(200).json(wallet_Info);

        }
        else{
                return res.status(200).json(check_wallet);
        }
        
    }
    

    const getInfo=await prisma.score.create(
        {
            data:{
                address:wallet,
                score:info.score,
                last_Signature:info.last_Signature,
                date:new Date(),
                scoreLable:getInfo.scoreLable,
                reasons:info.reasons,
                confidence:info.confidence

            }
        }
    )    
  
    
    return res.json(getInfo);
}catch{
    return res.status(500).json({msg:"Server Not found"});
}

})


app.listen(port,(req,res)=>{
    console.log("port is running on ",port);
})
