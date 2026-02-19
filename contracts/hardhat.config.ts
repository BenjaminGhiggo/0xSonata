import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

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
      url: "https://rpc-pob.dev11.top",
      chainId: 57042,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: { devnet: "abc" },
    customChains: [
      {
        network: "devnet",
        chainId: 57042,
        urls: {
          apiURL: "https://explorer-pob.dev11.top/api",
          browserURL: "https://explorer-pob.dev11.top",
        },
      },
    ],
  },
};

export default config;
