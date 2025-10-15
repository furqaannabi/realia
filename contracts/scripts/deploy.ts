import hre from "hardhat";
import realiaFactoryModule from "../ignition/modules/RealiaFactory.js";
import realiaNFTModule from "../ignition/modules/RealiaNFT.js";

async function main() {
  const { ignition, id } = await hre.network.connect();
  
  const { realiaFactory } = await ignition.deploy(realiaFactoryModule);
  
  const { realiaNFT } = await ignition.deploy(realiaNFTModule, {
    parameters: {
      RealiaNFTModule: {
        realiaFactory: realiaFactory.address,
      },
    },
  });

  
  console.log("Setting factory address in RealiaNFT...");
  await realiaFactory.write.setRealiaNFT([realiaNFT.address]);
  
  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});