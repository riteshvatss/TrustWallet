import express from 'express';
import { prisma } from './lib/prisma.js';
import cors from "cors";
const app=new express();
const port=3000;


app.use(cors());
import {PublicKey, Connection,clusterApiUrl } from '@solana/web3.js';
import { behaviorScore } from './services/behaviorScore.js';
app.use(express.json());




app.post("/v1/getScore",async(req,res)=>{
    try{
     
       
    const {wallet}=req.body;
    console.log(wallet);
   
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
                const info=await behaviorScore(wallet);
              
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
    
    const info=await behaviorScore(wallet);
    
    
    const getInfo=await prisma.score.create(
        {
            data:{
                address:wallet,
                score:info.score,
                last_Signature:info.last_Signature,
                date:new Date(),
                scoreLable:info.scoreLable,
                reasons:info.reasons,
                confidence:info.confidence

            }
        },
    )    
  
    
    return res.status(200).json(getInfo);
}catch{
    return res.status(500).json({msg:"Server Not found"});
}

})


app.listen(port,(req,res)=>{
    console.log("port is running on ",port);
})
