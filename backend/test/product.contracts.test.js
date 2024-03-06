const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("supplyChainContract", function () {
  let supplyChainContract;
  let owner;
  let manufacturer;
  let inspector;
  let distributor;
  let retailer;
  let consumer;
  let recordId;
  let manufacturingDate = "2022-03-01";
  let componentIds = ["component1", "component2"];
  let metadataCID = "ipfs://Qm..."; // Example IPFS CID
  let authenticationCID = "ipfs://Qm...";

  beforeEach(async function () {
    [owner, manufacturer, inspector, distributor, retailer, consumer] = await ethers.getSigners();

    const SupplyChainContract = await ethers.getContractFactory("SupplyChainContract");
    supplyChainContract = await SupplyChainContract.deploy(owner);
  });

  it("should create a new record", async function () {
    // Call the createProductBatch function and capture the returned recordId
    const transaction = await supplyChainContract.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    // Retrieve the record details using the recordId
    const record = await supplyChainContract.ProductBatches(recordId);

    // Assert the record details
    expect(record.manufacturer).to.equal(manufacturer.address);
    expect(record.status).to.equal(0); // Status.InProduction
    expect(await supplyChainContract.ownerOf(recordId)).to.equal(manufacturer.address);
  });

  it("should update the status of a record", async function () {
    const transaction = await supplyChainContract.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await supplyChainContract.connect(manufacturer).updateBatchStatus(recordId, 1); // Status.InInspection
    const record = await supplyChainContract.ProductBatches(recordId);
    expect(record.status).to.equal(1); // Status.InInspection
  });

  it("should add an inspector to a record", async function () {
    const transaction = await supplyChainContract.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await supplyChainContract.connect(manufacturer).addInspector(recordId, inspector.address, "2022-03-05", authenticationCID);
    const record = await supplyChainContract.ProductBatches(recordId);
    
    // Get the number of inspections
    const [inspectionCount, inspections] = await supplyChainContract.getInspectionStatus(recordId);
    
    // Check if there is one inspection
    expect(inspectionCount).to.equal(1);
    
    // Check the details of the first inspection
    expect(inspections[0].inspector).to.equal(inspector.address);
    expect(inspections[0].status).to.equal(0); // InspectionStatus.Pending
  });

  it("should update the inspection status of a record", async function () {
    const transaction = await supplyChainContract.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await supplyChainContract.connect(manufacturer).addInspector(recordId, inspector.address, "2022-03-05", authenticationCID);
    await supplyChainContract.connect(inspector).updateInspection(recordId, 1, "2022-03-06"); // Specify distributor's address as sender
    const record = await supplyChainContract.ProductBatches(recordId);

    // Get the number of inspections
    const [inspectionCount, inspections] = await supplyChainContract.getInspectionStatus(recordId);

    // Check the details of the first inspection
    expect(inspections[0].status).to.equal(1); // InspectionStatus.Approved
    expect(inspections[0].inspectionDate).to.equal("2022-03-06");
  });

  it("should transfer ownership of a record", async function () {
    const transaction = await supplyChainContract.connect(manufacturer).createProductBatch(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await supplyChainContract.connect(manufacturer).transferBatchOwnership(recordId, distributor.address, 0); // OwnerType.Distributor
    const record = await supplyChainContract.ProductBatches(recordId);

    expect(await supplyChainContract.ownerOf(recordId)).to.equal(distributor.address);
  });

  it("should revert when creating a record with an empty manufacturing date", async function () {
    await expect(
      supplyChainContract.connect(manufacturer).createProductBatch("", componentIds, metadataCID)
    ).to.be.revertedWith("Manufacturing date cannot be empty");
  });

  it("should revert when updating the status of a non-existent record", async function () {
    await expect(
      supplyChainContract.connect(manufacturer).updateBatchStatus(9999, 1) // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when adding an inspector to a non-existent record", async function () {
    await expect(
      supplyChainContract.connect(manufacturer).addInspector(9999, inspector.address, "2022-03-05", authenticationCID) // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when updating the inspection status of a non-existent record", async function () {
    await expect(
      supplyChainContract.connect(inspector).updateInspection(9999, 1, "2022-03-06") // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when transferring ownership of a non-existent record", async function () {
    await expect(
      supplyChainContract.connect(manufacturer).transferBatchOwnership(9999, distributor.address, 0) // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });
});
