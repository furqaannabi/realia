import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealiaFactoryModule", (m) => {
  const realiaFactory = m.contract("RealiaFactory");
  return { realiaFactory };
});
