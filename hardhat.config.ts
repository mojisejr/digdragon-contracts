import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    optimism_testnet: {
      url: `https://opt-goerli.g.alchemy.com/v2/${process.env.op_test_alchemy_key}`,
      accounts: [process.env.wallet!],
    },
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/uLt7UG2JOQRZKuvuhG-ARE-7_2i5oTXA",
      accounts: [process.env.wallet!],
    },
    bitkub_testnet: {
      url: "https://rpc-testnet.bitkubchain.io",
      accounts: [process.env.wallet2!],
    },
    mumbai_testnet: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.wallet!],
    },
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: "8TGZXBVUDY569ZA7TPK93B2FTB4DK17PNU",
    // apiKey: "FHZCC9HCY675QMCDID8WG7FH6IDEJSG5B5",
    // apiKey: "PX1UPAJSMHJPBT8N6GWIUXQZCE26TFPMU3",
    customChains: [
      {
        network: "bitkub_testnet",
        chainId: 25925,
        urls: {
          apiURL: "https://testnet.bkcscan.com/api",
          browserURL: "https://testnet.bkcscan.com/",
        },
      },
      {
        network: "bitkub_mainnet",
        chainId: 96,
        urls: {
          apiURL: "https://www.bkcscan.com/api/",
          browserURL: "https://www.bkcscan.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: false,
    currency: "THB",
    gasPriceApi:
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
};

export default config;
