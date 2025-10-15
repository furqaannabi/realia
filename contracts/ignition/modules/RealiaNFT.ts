import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealiaNFTModule", (m) => {
  const realiaFactory = m.getParameter("realiaFactory");
  const realiaNFT = m.contract("RealiaNFT", [realiaFactory]);
  return { realiaNFT };
});
