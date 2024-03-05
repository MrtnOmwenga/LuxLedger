const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LedgerContract", function () {
  let ledgerContract;
  let owner;
  let manufacturer;
  let inspector;
  let distributor;
  let retailer;
  let independentEntity;
  let recordId;
  let manufacturingDate = "2022-03-01";
  let componentIds = ["component1", "component2"];
  let metadataCID = "ipfs://Qm..."; // Example IPFS CID

  beforeEach(async function () {
    [owner, manufacturer, inspector, distributor, retailer, independentEntity] = await ethers.getSigners();

    const LedgerContract = await ethers.getContractFactory("LedgerContract");
    ledgerContract = await LedgerContract.deploy(owner);
  });

  it("should create a new record", async function () {
    // Call the createRecord function and capture the returned recordId
    const transaction = await ledgerContract.connect(manufacturer).createRecord(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    // Retrieve the record details using the recordId
    const record = await ledgerContract.Ledger(recordId);

    // Assert the record details
    expect(record.manufacturer).to.equal(manufacturer.address);
    expect(record.status).to.equal(0); // Status.InProduction
    expect(await ledgerContract.ownerOf(recordId)).to.equal(manufacturer.address);
  });

  it("should update the status of a record", async function () {
    const transaction = await ledgerContract.connect(manufacturer).createRecord(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await ledgerContract.connect(manufacturer).updateRecordStatus(recordId, 1); // Status.InInspection
    const record = await ledgerContract.Ledger(recordId);
    expect(record.status).to.equal(1); // Status.InInspection
  });

  it("should add an inspector to a record", async function () {
    const transaction = await ledgerContract.connect(manufacturer).createRecord(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await ledgerContract.connect(manufacturer).addInspector(recordId, inspector.address, "2022-03-05");
    const record = await ledgerContract.Ledger(recordId);
    
    // Get the number of inspections
    const [inspectionCount, inspections] = await ledgerContract.getInspectionStatus(recordId);
    
    // Check if there is one inspection
    expect(inspectionCount).to.equal(1);
    
    // Check the details of the first inspection
    expect(inspections[0].inspector).to.equal(inspector.address);
    expect(inspections[0].status).to.equal(0); // InspectionStatus.Pending
  });

  it("should update the inspection status of a record", async function () {
    const transaction = await ledgerContract.connect(manufacturer).createRecord(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await ledgerContract.connect(manufacturer).addInspector(recordId, inspector.address, "2022-03-05");
    await ledgerContract.connect(inspector).updateInspection(recordId, 1, "2022-03-06"); // Specify distributor's address as sender
    const record = await ledgerContract.Ledger(recordId);

    // Get the number of inspections
    const [inspectionCount, inspections] = await ledgerContract.getInspectionStatus(recordId);

    // Check the details of the first inspection
    expect(inspections[0].status).to.equal(1); // InspectionStatus.Approved
    expect(inspections[0].inspectionDate).to.equal("2022-03-06");
  });

  it("should transfer ownership of a record", async function () {
    const transaction = await ledgerContract.connect(manufacturer).createRecord(manufacturingDate, componentIds, metadataCID);
    const recordId = transaction.value;

    await ledgerContract.connect(manufacturer).transferRecordOwnership(recordId, distributor.address, 0, "2022-03-05"); // OwnerType.Distributor
    const record = await ledgerContract.Ledger(recordId);

    const [ownershipHistoryCount, ownershipHistory] = await ledgerContract.getOwnershipHistory(recordId);
    expect(await ledgerContract.ownerOf(recordId)).to.equal(distributor.address);
    expect(ownershipHistory.length).to.equal(2);
    expect(ownershipHistory[1].owner).to.equal(distributor.address);
    expect(ownershipHistory[1].ownerType).to.equal(0); // OwnerType.Distributor
    expect(ownershipHistory[1].purchaseDate).to.equal("2022-03-05");
  });

  it("should revert when creating a record with an empty manufacturing date", async function () {
    await expect(
      ledgerContract.connect(manufacturer).createRecord("", componentIds, metadataCID)
    ).to.be.revertedWith("Manufacturing date cannot be empty");
  });

  it("should revert when updating the status of a non-existent record", async function () {
    await expect(
      ledgerContract.connect(manufacturer).updateRecordStatus(9999, 1) // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when adding an inspector to a non-existent record", async function () {
    await expect(
      ledgerContract.connect(manufacturer).addInspector(9999, inspector.address, "2022-03-05") // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when updating the inspection status of a non-existent record", async function () {
    await expect(
      ledgerContract.connect(inspector).updateInspection(9999, 1, "2022-03-06") // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });

  it("should revert when transferring ownership of a non-existent record", async function () {
    await expect(
      ledgerContract.connect(manufacturer).transferRecordOwnership(9999, distributor.address, 0, "2022-03-05") // Non-existent record ID
    ).to.be.revertedWith("Record does not exist");
  });
});
