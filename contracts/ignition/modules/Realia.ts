import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealiaModule", (m) => {
  const realia = m.contract("Realia");
  return { realia };
});
