import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

const getHDWallet = () => {
	const MNEMONIC = process.env.MNEMONIC!;
	const PRIVATE_KEY = process.env.PRIVATE_KEY!;

	/*
	if (MNEMONIC && MNEMONIC !== "") {
	  return {
		mnemonic: MNEMONIC,
	  }
	}
	*/
	if (PRIVATE_KEY && PRIVATE_KEY !== "") {
	  return [PRIVATE_KEY]
	}
	throw Error("Private Key Not Set! Please set up .env");
}


const config: HardhatUserConfig = {
	solidity: '0.8.17',
	networks: {
		hardhat: {
			chainId: 1337,
		},
		cronosTest: {
			url: "https://evm-t3.cronos.org/",
      		accounts: getHDWallet(),
		},
	},
};

export default config;
