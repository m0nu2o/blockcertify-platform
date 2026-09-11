
import { ethers } from 'hardhat';

async function main() {
  const factory = await ethers.getContractFactory('BlockCertifyRegistry');
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log('BlockCertifyRegistry deployed to:', await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
