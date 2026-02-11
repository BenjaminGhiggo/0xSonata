require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        devnet: {
            url: "https://rpc-pob.dev11.top",
            chainId: 57042,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        tanenbaum: {
            url: "https://rpc.tanenbaum.io",
            chainId: 5700,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        zksys: {
            url: "https://rpc-test-zk.syscoin.org/",
            chainId: 5701,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            devnet: "abc",
            tanenbaum: "abc",
        },
        customChains: [
            {
                network: "devnet",
                chainId: 57042,
                urls: {
                    apiURL: "https://explorer-pob.dev11.top/api",
                    browserURL: "https://explorer-pob.dev11.top",
                },
            },
            {
                network: "tanenbaum",
                chainId: 5700,
                urls: {
                    apiURL: "https://explorer.tanenbaum.io/api",
                    browserURL: "https://explorer.tanenbaum.io",
                },
            },
        ],
    },
};

