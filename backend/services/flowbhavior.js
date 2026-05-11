import {
   
    Connection,
} from "@solana/web3.js";
import 'dotenv/config';

const GOOD_ADDRESSES = new Set([ "11111111111111111111111111111111","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bwd","metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb","9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin","JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4","whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc","9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP","RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr","675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8","CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK","MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2pgJk","So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo","4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY","JD3bq9hGdy38PuWQ4h2YJpELmHVGPPfFSuFkpzAd9zfu","DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1","mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68","hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K","CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz","TSWAPaqyCSx2KABk68Shruf4rp7CxcAi9UTjtKujMUf","Stake11111111111111111111111111111111111111112","SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy","marinade11111111111111111111111111111111111","jito1111111111111111111111111111111111111111",   
]);

const BAD_ADDRESSES = new Set([
    "ScamFake1111111111111111111111111111111111111","DrainWallet111111111111111111111111111111111","PhishSite1111111111111111111111111111111111","BL4ENmVhfVSEMgDRFHKnb9x8NvPnXVAJNv2bMGXLuaJj","EzFiNMRtCHSNRHYqxBjkUMJT5iEiPYXBJoEBY1g6JvEt","RugPu11111111111111111111111111111111111111111",
]);
const SCORE_WEIGHTS = {
    INFLOW_BASE: 2,
    OUTFLOW_BASE: -1,
    INTERACTION_GOOD: 15,
    INTERACTION_BAD: -40,
    UNIQUE_SENDER_BONUS: 5,
    RAPID_TX_PENALTY: -10,
    HIGH_VOLUME_BONUS: 10,
    LOW_ACTIVITY_PENALTY: -5,
    RAPID_TX_THRESHOLD_MS: 3000,
    MAX_SCORE: 100,
    MIN_SCORE: 0,
};
 
export async function flowbehavior(signatures, walletAddress = "") {
    const connection=new Connection(process.env.RPC_Mainet);
 
    const config = {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0,
    };

    const rawTransactions = await Promise.all(
        signatures.map((sig) =>
            connection
                .getTransaction(sig.signature, config)
                .catch(() => null)
        )
    );
 
    const transactions = rawTransactions.filter(Boolean);
    let inflowCount    = 0;
    let outflowCount   = 0;
    let inflowVolume   = 0;
    let outflowVolume  = 0;
    let goodInteractions = 0;
    let badInteractions  = 0;
    let rapidTxBursts    = 0;
    let failedTxCount    = 0;
 
    const uniqueSenders      = new Set();
    const goodAddressesHit   = new Set();
    const badAddressesHit    = new Set();
    const interactedPrograms = new Set();
 
    let lastBlockTime = null;
 
    // ── Per-transaction analysis ──
    for (const tx of transactions) {
        const meta    = tx.meta;
        const message = tx.transaction?.message;
 
        if (!meta || !message) continue;
 
        // Failed transactions
        if (meta.err !== null) {
            failedTxCount++;
            continue;
        }
 
        // ── Account keys (v0 + legacy compatible) ──
        let accountKeys = [];
        if (message.staticAccountKeys) {
            // Versioned transaction (MessageV0)
            accountKeys = [
                ...message.staticAccountKeys.map((k) => k.toString()),
                ...(meta.loadedAddresses?.writable?.map((k) => k.toString()) ?? []),
                ...(meta.loadedAddresses?.readonly?.map((k) => k.toString()) ?? []),
            ];
        } else if (message.accountKeys) {
            // Legacy transaction
            accountKeys = message.accountKeys.map((k) => k.toString());
        }
 
        const feePayer = accountKeys[0] ?? "";
 
        // ── Inflow / Outflow detection ──
        const walletIndex = walletAddress
            ? accountKeys.indexOf(walletAddress)
            : 0;
 
        if (walletIndex !== -1) {
            const pre  = meta.preBalances[walletIndex]  ?? 0;
            const post = meta.postBalances[walletIndex] ?? 0;
            const lamports_Transfer = post - pre;
 
            if (lamports_Transfer > 0) {
                inflowCount++;
                inflowVolume += lamports_Transfer;
            } else if (lamports_Transfer < 0) {
                outflowCount++;
                outflowVolume += Math.abs(lamports_Transfer);
            }
        }

        if (feePayer && feePayer !== walletAddress) {
            uniqueSenders.add(feePayer);
        }

        for (const addr of accountKeys) {
            interactedPrograms.add(addr);
 
            if (GOOD_ADDRESSES.has(addr)) {
                goodAddressesHit.add(addr);
                goodInteractions++;
            }
            if (BAD_ADDRESSES.has(addr)) {
                badAddressesHit.add(addr);
                badInteractions++;
            }
        }


        const blockTime = tx.blockTime;
        if (lastBlockTime !== null && blockTime !== null) {
            const diffMs = Math.abs(blockTime - lastBlockTime) * 1000;
            if (diffMs < SCORE_WEIGHTS.RAPID_TX_THRESHOLD_MS) {
                rapidTxBursts++;
            }
        }
        if (blockTime) lastBlockTime = blockTime;
    }
    let score = 50; 
 
    score += inflowCount  * SCORE_WEIGHTS.INFLOW_BASE;
    score += outflowCount * SCORE_WEIGHTS.OUTFLOW_BASE;
    score += goodInteractions * SCORE_WEIGHTS.INTERACTION_GOOD;
    score += badInteractions  * SCORE_WEIGHTS.INTERACTION_BAD;
    score += uniqueSenders.size > 5 ? SCORE_WEIGHTS.UNIQUE_SENDER_BONUS : 0;
    score += rapidTxBursts * SCORE_WEIGHTS.RAPID_TX_PENALTY;
    score += inflowVolume > 1_000_000_000 ? SCORE_WEIGHTS.HIGH_VOLUME_BONUS : 0; // >1 SOL in
    score += transactions.length < 3 ? SCORE_WEIGHTS.LOW_ACTIVITY_PENALTY : 0;
 
  
    score = Math.min(SCORE_WEIGHTS.MAX_SCORE, Math.max(SCORE_WEIGHTS.MIN_SCORE, Math.round(score)));
 
   
    const flags=buildFlags({
            badInteractions,
            rapidTxBursts,
            failedTxCount,
            transactions,
            badAddressesHit,
        });
 
   
    const report = {
        score,
        flags
    };
 
    return report;
}

function buildFlags({ badInteractions, rapidTxBursts, failedTxCount, transactions, badAddressesHit }) {
    const flags = [];
 
    if (badInteractions > 0) {
        flags.push({
            severity: "CRITICAL",
            code: "BAD_ADDRESS_INTERACTION",
            message: `Wallet interacted with ${badInteractions} flagged/malicious address(es): ${[...badAddressesHit].join(", ")}`,
        });
    }
    if (failedTxCount > transactions.length * 0.3) {
        flags.push({
            severity: "MEDIUM",
            code: "HIGH_FAILURE_RATE",
            message: `${failedTxCount} of ${transactions.length + failedTxCount} transactions failed — unusual failure rate.`,
        });
    }
    
 
    return flags;
}