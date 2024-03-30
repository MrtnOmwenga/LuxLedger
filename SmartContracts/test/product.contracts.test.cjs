const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("productInformation", function () {
  let productInformation;
  let LotInformation;
  let owner;
  let manufacturer;
  let inspector;
  let distributor;
  let retailer;
  let consumer;
  let batchId;
  let manufacturingDate = "2022-03-01";
  let componentIds = [0, 1, 2];
  let metadataCID = "ipfs://Qm..."; // Example IPFS CID
  let authenticationCID = "ipfs://Qm...";
  let defectDescriptionCID = "ipfs://Qm...";

  beforeEach(async function () {
    [owner, manufacturer, inspector, distributor, retailer, consumer] = await ethers.getSigners();

    const lotInformationInstance = await ethers.getContractFactory("LotInformation");
    LotInformation = await lotInformationInstance.deploy();

    const ProductInformation = await ethers.getContractFactory("ProductInformation");
    productInformation = await ProductInformation.deploy(LotInformation.target);
  });

  it("should create a new record", async function () {
    // Call the createProductBatch function and capture the returned batchId
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    // Retrieve the record details using the batchId
    const product = await productInformation.ProductBatches(0);

    // Assert the record details
    expect(product.manufacturer).to.equal(manufacturer.address);
    expect(product.status).to.equal(0); // Status.InProduction
    expect(await productInformation.ownerOf(0)).to.equal(manufacturer.address);
  });

  it("should update the status of a record", async function () {
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    await productInformation.connect(manufacturer).updateBatchStatus(0, 1); // Status.InInspection
    const product = await productInformation.ProductBatches(0);
    expect(product.status).to.equal(1); // Status.InInspection
  });

  it("should add an inspector to a record", async function () {
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    await productInformation.connect(manufacturer).addInspector(0, inspector.address, "2022-03-05");
    const product = await productInformation.ProductBatches(0);
    
    // Get the number of inspections
    const [inspectionCount, inspections] = await productInformation.getInspectionStatus(0);
    
    // Check if there is one inspection
    expect(inspectionCount).to.equal(1);
    
    // Check the details of the first inspection
    expect(inspections[0].inspector).to.equal(inspector.address);
    expect(inspections[0].status).to.equal(0); // InspectionStatus.Pending
  });

  it("should update the inspection status of a record", async function () {
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    await productInformation.connect(manufacturer).addInspector(0, inspector.address, "2022-03-05");
    await productInformation.connect(inspector).updateInspection(0, 1, "2022-03-06", authenticationCID);
    const product = await productInformation.ProductBatches(0);

    // Get the number of inspections
    const [inspectionCount, inspections] = await productInformation.getInspectionStatus(0);

    // Check the details of the first inspection
    expect(inspections[0].status).to.equal(1); // InspectionStatus.Approved
    expect(inspections[0].inspectionDate).to.equal("2022-03-06");
  });

  it("should revert when creating a record with an empty manufacturing date", async function () {
    await expect(
      productInformation.connect(manufacturer).createProductBatch(100, "", componentIds, metadataCID)
    ).to.be.revertedWith("Manufacturing date cannot be empty");
  });

  it("should revert when updating the status of a non-existent record", async function () {
    await expect(
      productInformation.connect(manufacturer).updateBatchStatus(9999, 1) // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should revert when adding an inspector to a non-existent record", async function () {
    await expect(
      productInformation.connect(manufacturer).addInspector(9999, inspector.address, "2022-03-05") // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should revert when updating the inspection status of a non-existent record", async function () {
    await expect(
      productInformation.connect(inspector).updateInspection(9999, 1, "2022-03-06", authenticationCID) // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should recall a product batch", async function () {
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    // Recall the product batch
    await productInformation.connect(manufacturer).recallProductBatch(0, defectDescriptionCID);

    const product = await productInformation.ProductBatches(0);
    expect(product.status).to.equal(5); // ProductStatus.Recalled

    const recalls = await productInformation.recalls(0);
    expect(recalls.reason).to.equal(defectDescriptionCID)
  });

  it("should report a defect", async function () {
    await productInformation.connect(manufacturer).createProductBatch(100, manufacturingDate, componentIds, metadataCID);

    await productInformation.connect(inspector).reportDefect(0, defectDescriptionCID);
    const defect = await productInformation.defects(0);
    
    expect(defect.batchId).to.equal(0);
    expect(defect.inspector).to.equal(inspector.address);
    expect(defect.descriptionCID).to.equal(defectDescriptionCID);
  });
});
