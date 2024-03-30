// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from "hardhat";
import { createHelia } from 'helia';
import { json } from '@helia/json';
import * as productInformation from "./product_information.sample.json" with { type: "json" };
import * as qualityControl from "./quality_control.sample.json" with { type: "json" };;

const batches = productInformation.default.batches;
const defects = qualityControl.default.defects;

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.parseEther("0.001");

  const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
    value: lockedAmount,
  });

  await lock.waitForDeployment();

  console.log(
    `Lock with ${ethers.formatEther(
      lockedAmount
    )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  );

  let owner;
  let seller;
  let buyer;
  let inspector;

  const helia = await createHelia();
  const IPFS = json(helia);

  // Function to add JSON object to IPFS and return CID
  async function addToIPFS(jsonObject) {
    const address = await IPFS.add(jsonObject);
    return address.toString();
  }

  // Deploy contracts
  [owner, seller, buyer, inspector] = await ethers.getSigners();

  const lotInformationInstance = await ethers.getContractFactory("LotInformation");
  const LotInformation = await lotInformationInstance.deploy();

  const productInformationInstance = await ethers.getContractFactory("ProductInformation");
  const ProductInformation = await productInformationInstance.deploy(LotInformation.target);

  // Deploy Escrow contract with the address of the ProductInformation contract
  const EscrowFactory = await ethers.getContractFactory("Escrow");
  const Escrow = await EscrowFactory.deploy(ProductInformation.target, LotInformation.target);

  console.log("LotInformation: ", LotInformation.target);
  console.log("Product Information: ", ProductInformation.target);
  console.log("Escrow: ", Escrow.target);

  // Populate contracts
  const batchSize = 100;
  const lotSize = 50;
  const pricePerUnit = 1;

  await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", [0, 1, 2], await addToIPFS(batches[0]));
  await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", [0, 1, 2], await addToIPFS(batches[1]));
  await ProductInformation.connect(seller).createLot(0, lotSize);
  await ProductInformation.connect(seller).createLot(0, lotSize);

  await ProductInformation.connect(seller).addInspector(0, inspector.address, "2022-04-01");

  await ProductInformation.connect(inspector).reportDefect(0, await addToIPFS(defects[0]));
  await ProductInformation.connect(inspector).reportDefect(1, await addToIPFS(defects[1]));

  // Approve transaction
  await LotInformation.connect(seller).approve(Escrow.target, 0);
  await ProductInformation.connect(seller).approve(Escrow.target, 1);

  await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);
  await Escrow.connect(seller).createBatchListing(1, pricePerUnit);

  console.log("Data added to blockchain");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
