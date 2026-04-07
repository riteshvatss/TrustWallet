# Trust Wallet Analyzer (SDK + Extension)

I built this because I kept seeing the same problem in Web3 — people sending funds to wallets they *don’t really understand*.
One wrong transfer = gone forever.
So this project is my attempt to add a simple **"trust layer"** before you interact with any wallet.

# What this project actually does

Instead of just showing raw blockchain data, this tool tries to **interpret behavior**.
It looks at a wallet and answers:
> “Does this look like a normal user… or something suspicious?”
You get:
* A **score (0–100)**
* A **clear verdict** (Safe / Suspicious / Risky)
* And most importantly — **reasons** behind it

---

## 📁 Project Structure

```
.
├── Backend-SDK          # NPM package (plug & play wallet scoring)
├── Frontend_Extension   # Chrome extension to check wallets instantly
├── backend              # Core API (analysis engine)
├── test                 # Random testing scripts
└── README.md
```

---

## How scoring works (simple version)

This is based on patterns.
Things I currently look at:

*  Account age → new wallets are riskier
* Transaction behavior → spammy / bot-like activity
* Balance changes → sudden drains or weird patterns
* Contract interactions → risky programs
* Frequency → too fast = suspicious

Then I combine signals → generate:
* Score
* Reasons
* Final verdict

---

## 📦 SDK Usage

If you’re a dev, you can plug this in directly 

### Install

```bash
npm install @riteshh123/wallet-audit
```

### Use

```js
import { analyzeWallet } from "@riteshh123/wallet-audit";

const data =await analyzeWallet(walletAddress);
console.log(data);
```

## Response Format
{ 
    id: number,   
    address: string, 
    score: number,    //0-100
    lastSignature: string,  
    date: string,  
    scoreLable: string,    //"Risky"||"Moderately Safe"||"Safe"||"Highly Safe"
    reasons:string[],      //["Very low transaction history"]
    confidence:string      //"Low"||"Medium"||"High"
}

---

## 🖥️ Backend Setup

```bash
cd backend
npm install
npx prisma generate
node index.js
```

### .env

```
DATABASE_URL=your_database_url
```


## Why I built this

* Too many scams in crypto
* No simple way to *quickly judge a wallet*
* Raw blockchain data is hard to interpret

---

## Testing

```bash
cd test
node index.js
```

---

## What’s next

Still early. A lot to improve:
* Better scoring accuracy
* Reduce false positives
* Multi-chain support (ETH, Polygon)
* Maybe ML-based detection later

