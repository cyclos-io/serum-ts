// Creates token-mint.json and markets.json
// given solana-tokenlist.json
const fs = require("fs");

const OG_TOKEN_LIST = require("./solana-tokenlist.json");
const OG_MARKETS_LIST = require("./markets.json");

const SERUM_DEXV3 = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const SERUM_DEXV2 = "EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o";
const SERUM_DEXV1 = "BJ3jrUzddfuSrZHXSCxMUUQsjKEyLmuuyZebkcaFp2fg";

const extraBases = require("./extra-bases.json");

function main() {

    let { tokens } = OG_TOKEN_LIST;
    const markets = OG_MARKETS_LIST;

    // NEW TOKEN LIST -> { symbol, address }[]
    let newTokenList = tokens.map(token => {
        if (token.chainId != 101) return;
        return ({
            "address": `${token.address}`,
            "name": `${token.symbol}`
        });
    });
    fs.writeFileSync("./new-token-mist.json", JSON.stringify(newTokenList));

    // NEW MARKET LIST -> { market address, deprecated, name -> pair, programID -> mostly dexv3 }
    // remove the deprecated ones, only serum DEX v3 program 
    let nonDeprecatedOnes = markets.filter(m => !m.deprecated && (m.programId == SERUM_DEXV3))
    // remove the USDC USDT bases as they are constructed from tokens-list
    nonDeprecatedOnes = nonDeprecatedOnes.filter(m => {
        let to = m.name.split('/')[1];
        if (to === "USDC" || to === "USDT") {
            return false;
        }
        return true;
    });

    const newMarketList = [];
    // 101 = Mainnet
    tokens = tokens.filter(t => t.chainId == 101);
    tokens = tokens.filter(t => (t.extensions?.serumV3Usdc || t.extensions?.serumV3Usdt));

    tokens.forEach(t => {
        const USDC = t.extensions.serumV3Usdc;
        const USDT = t.extensions.serumV3Usdt;
        if (USDC) {
            newMarketList.push({
                address: USDC,
                deprecated: false,
                name: `${t.symbol}/USDC`,
                programId: SERUM_DEXV3
            });
        }
        if (USDT) {
            newMarketList.push({
                address: USDT,
                deprecated: false,
                name: `${t.symbol}/USDT`,
                programId: SERUM_DEXV3
            });
        }
    })

    // Add the extra bases.
    const bases = Object.keys(extraBases)
    bases.map(base => {
        for (let pair in extraBases[base]) {
            let t = {
                "address": extraBases[base][pair],
                "deprecated": false,
                "name": `${pair}${base}`,
                "programId": SERUM_DEXV3
            };
            newMarketList.push(t);
        }
    })
    fs.writeFileSync("./new-markets.json", JSON.stringify(newMarketList));
}

main();
