import { ethers } from 'ethers';
import realiaFactoryABI from './RealiaFactory.json';
import realiaNFTABI from './RealiaNFT.json';

if (!process.env.ALCHEMY_API_KEY || !process.env.WALLET_KEY || !process.env.REALIA_FACTORY_CONTRACT_ADDRESS || !process.env.REALIA_NFT_CONTRACT_ADDRESS) {
  throw new Error('Missing environment variables');
}

const provider = new ethers.JsonRpcProvider(`https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider);
const realiaFactory_contract = new ethers.Contract(process.env.REALIA_FACTORY_CONTRACT_ADDRESS, realiaFactoryABI.abi, wallet);
const realiaNFT_contract = new ethers.Contract(process.env.REALIA_NFT_CONTRACT_ADDRESS, realiaNFTABI.abi, wallet);

export {
  provider,
  realiaFactory_contract,
  realiaNFT_contract,
};
