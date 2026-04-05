import express from 'express';
import { prisma } from './lib/prisma.js';
import cors from "cors";
const app=new express();

app.use(cors());
const port =3000;
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


    
    const balance_lamports=await connection.getBalance(wallet_Address);
    const max_expected_age=52;
    const target_tx=50;
    const max_last_activeweeks=4;
    
    // console.log(Wallet_weeks_Transactionhappened);
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

    score=score*100

    let scoreLable="";
    if(score<35){
        scoreLable="bad";
    }else if(score<=60){
        scoreLable="good";
    }
    else if(score<=80){
        scoreLable="very good"
    }
    else {
        scoreLable="excellent"
    }
    let info={
        last_Signature:last_Signature,
        score:Math.floor(score),
        scoreLable:scoreLable
    }

    return(info)

}

app.post("/v1/getScore",async(req,res)=>{
    try{
       
    const {wallet}=req.body;
   
    if(!wallet){
        return res.status(300).json({
            err:"wront input"
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
                            scoreLable:info.scoreLable

                    },
                    where:{
                        address:wallet
                    }
                });
                console.log(wallet_Info);
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
