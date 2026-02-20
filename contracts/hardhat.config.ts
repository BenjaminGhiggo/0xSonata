import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "57042", 10);
const EXPLORER_API_URL = process.env.EXPLORER_API_URL || "";
const EXPLORER_BROWSER_URL = process.env.EXPLORER_BROWSER_URL || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    devnet: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: { devnet: "abc" },
    customChains: [
      {
        network: "devnet",
        chainId: CHAIN_ID,
        urls: {
          apiURL: EXPLORER_API_URL,
          browserURL: EXPLORER_BROWSER_URL,
        },
      },
    ],
  },
};

export default config;
