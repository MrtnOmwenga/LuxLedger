const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("productInformation", function () {
  let productInformation;
  let owner;
  let manufacturer;
  let inspector;
  let distributor;
  let retailer;
  let consumer;
  let batchId;
  let manufacturingDate = "2022-03-01";
  let componentIds = ["component1", "component2"];
  let metadataCID = "ipfs://Qm..."; // Example IPFS CID
  let authenticationCID = "ipfs://Qm...";
  let defectDescriptionCID = "ipfs://Qm...";

  beforeEach(async function () {
    [owner, manufacturer, inspector, distributor, retailer, consumer] = await ethers.getSigners();

    const ProductInformation = await ethers.getContractFactory("ProductInformation");
    productInformation = await ProductInformation.deploy();
  });

  it("should create a new record", async function () {
    // Call the createProductBatch function and capture the returned batchId
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    // Retrieve the record details using the batchId
    const product = await productInformation.ProductBatches(batchId);

    // Assert the record details
    expect(product.manufacturer).to.equal(manufacturer.address);
    expect(product.status).to.equal(0); // Status.InProduction
    expect(await productInformation.ownerOf(batchId)).to.equal(manufacturer.address);
  });

  it("should update the status of a record", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    await productInformation.connect(manufacturer).updateBatchStatus(batchId, 1); // Status.InInspection
    const product = await productInformation.ProductBatches(batchId);
    expect(product.status).to.equal(1); // Status.InInspection
  });

  it("should add an inspector to a record", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    await productInformation.connect(manufacturer).addInspector(batchId, inspector.address, "2022-03-05", authenticationCID);
    const product = await productInformation.ProductBatches(batchId);
    
    // Get the number of inspections
    const [inspectionCount, inspections] = await productInformation.getInspectionStatus(batchId);
    
    // Check if there is one inspection
    expect(inspectionCount).to.equal(1);
    
    // Check the details of the first inspection
    expect(inspections[0].inspector).to.equal(inspector.address);
    expect(inspections[0].status).to.equal(0); // InspectionStatus.Pending
  });

  it("should update the inspection status of a record", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    await productInformation.connect(manufacturer).addInspector(batchId, inspector.address, "2022-03-05", authenticationCID);
    await productInformation.connect(inspector).updateInspection(batchId, 1, "2022-03-06");
    const product = await productInformation.ProductBatches(batchId);

    // Get the number of inspections
    const [inspectionCount, inspections] = await productInformation.getInspectionStatus(batchId);

    // Check the details of the first inspection
    expect(inspections[0].status).to.equal(1); // InspectionStatus.Approved
    expect(inspections[0].inspectionDate).to.equal("2022-03-06");
  });

  it("should transfer ownership of a record", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    await productInformation.connect(manufacturer).transferBatchOwnership(batchId, distributor.address, 0); // OwnerType.Distributor
    const product = await productInformation.ProductBatches(batchId);

    expect(await productInformation.ownerOf(batchId)).to.equal(distributor.address);
  });

  it("should revert when creating a record with an empty manufacturing date", async function () {
    await expect(
      productInformation.connect(manufacturer).createProductBatch("", componentIds, metadataCID)
    ).to.be.revertedWith("Manufacturing date cannot be empty");
  });

  it("should revert when updating the status of a non-existent record", async function () {
    await expect(
      productInformation.connect(manufacturer).updateBatchStatus(9999, 1) // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should revert when adding an inspector to a non-existent record", async function () {
    await expect(
      productInformation.connect(manufacturer).addInspector(9999, inspector.address, "2022-03-05", authenticationCID) // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should revert when updating the inspection status of a non-existent record", async function () {
    await expect(
      productInformation.connect(inspector).updateInspection(9999, 1, "2022-03-06") // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should revert when transferring ownership of a non-existent record", async function () {
    await expect(
      productInformation.connect(manufacturer).transferBatchOwnership(9999, distributor.address, 0) // Non-existent record ID
    ).to.be.revertedWith("Product does not exist");
  });

  it("should recall a product batch", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    // Recall the product batch
    await productInformation.connect(manufacturer).recallProductBatch(batchId, defectDescriptionCID);

    const product = await productInformation.ProductBatches(batchId);
    expect(product.status).to.equal(5); // ProductStatus.Recalled

    const recalls = await productInformation.recalls(batchId);
    expect(recalls.reason).to.equal(defectDescriptionCID)
  });

  it("should allow returning recalled product batches", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    // Transfer ownership
    await productInformation.connect(manufacturer).transferBatchOwnership(batchId, distributor.address, 0); // OwnerType.Distributor

    // Recall the product batch
    await productInformation.connect(manufacturer).recallProductBatch(batchId, defectDescriptionCID);

    // Return the recalled product batch
    await productInformation.connect(distributor).returnRecalledProduct(batchId);

    const product = await productInformation.ProductBatches(batchId);
    expect(product.status).to.equal(6); // ProductStatus.Disposed
  });

  it("should report a defect", async function () {
    const transaction = await productInformation.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const batchId = transaction.value;

    await productInformation.connect(inspector).reportDefect(batchId, defectDescriptionCID);
    const defect = await productInformation.defects(0);
    
    expect(defect.productId).to.equal(batchId);
    expect(defect.inspector).to.equal(inspector.address);
    expect(defect.description).to.equal(defectDescriptionCID);
  });
});
