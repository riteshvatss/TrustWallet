import {PublicKey, Connection,clusterApiUrl } from '@solana/web3.js';

export async function behaviorScore(walletAddress){
        
    const connection=new Connection(clusterApiUrl("mainnet-beta"),"confirmed");


    let signatureoptions={
        
        limit:1000,
        commitment:"finalized",
    }
                                                                                                                                                                                   
    let wallet_Address=new PublicKey(walletAddress);
   
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
}else if(wallet_age_Weeks>52){
    reasons.push("Wallet is of old age");
}

if (burst_penalty >= 5 &&consistency<0.5) {
  reasons.push("Suspicious burst activity detected");
}

if (wallet_dead_from_lastWeeks > 3) {
  reasons.push("Wallet inactive for long periods");
}else if(wallet_dead_from_lastWeeks<3){
    reasons.push("wallet is recently active");
}

if (total_transactions < 10) {
  reasons.push("Very low transaction history");
}else if(total_transactions>60 &&burst_penalty==0){
    reasons.push("Good transaction history");
}



if (consistency < 0.3) {
  reasons.push("Unstable transaction behavior");
}else if(consistency>0.65){
    reasons.push("wallet have stable consistency");
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