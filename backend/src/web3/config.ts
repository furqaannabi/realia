import { ethers } from 'ethers';
import realiaABI from './Realia.json';

if (!process.env.ALCHEMY_API_KEY || !process.env.WALLET_KEY || !process.env.CONTRACT_ADDRESS) {
  throw new Error('Missing environment variables');
}

const provider = new ethers.JsonRpcProvider(`https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider);
const realia_contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, realiaABI.abi, wallet);

export {
  provider,
  realia_contract,
};
