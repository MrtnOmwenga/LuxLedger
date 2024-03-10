const { expect } = require("chai");
const { ethers } = require("hardhat");
const web3 = require('web3');

const tokens = (n) => {
  return web3.utils.toWei(n.toString(), "ether");
}

describe("Test returns", function (accounts) {
  let Escrow;
  let ProductInformation;
  let LotInformation;
  let owner
  let seller;
  let buyer;

  beforeEach(async () => {
    [owner, seller, buyer] = await ethers.getSigners();

    const lotInformationInstance = await ethers.getContractFactory("LotInformation");
    LotInformation = await lotInformationInstance.deploy();

    const productInformationInstance = await ethers.getContractFactory("ProductInformation");
    ProductInformation = await productInformationInstance.deploy(LotInformation.target);

    // Deploy Escrow contract with the address of the ProductInformation contract
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    Escrow = await EscrowFactory.deploy(ProductInformation.target, LotInformation.target);

    const batchSize = 100;
    const lotSize = 50;
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, lotSize);

    // Approve transaction
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    await ProductInformation.connect(seller).approve(Escrow.target, 1);

    await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);
    await Escrow.connect(seller).createBatchListing(1, pricePerUnit);

    await Escrow.connect(buyer).purchaseLot(0, { value: tokens(pricePerUnit * lotSize) });
    await Escrow.connect(buyer).purchaseBatch(1, { value: tokens(pricePerUnit * batchSize) });
  });

  it("should return lot", async function () {
    // Approve transfer
    await LotInformation.connect(buyer).approve(Escrow.target, 0);

    await Escrow.connect(buyer).returnLot(0);
    expect(await LotInformation.ownerOf(0)).to.equal(Escrow.target);

    const listing = await Escrow.connect(buyer).Returns(0);
    expect(listing.status).to.equal(0);
  });

  it("should return batch", async function () {
    // Approve transfer
    await ProductInformation.connect(buyer).approve(Escrow.target, 1);

    await Escrow.connect(buyer).returnBatch(1);
    expect(await ProductInformation.ownerOf(1)).to.equal(Escrow.target);

    const listing = await Escrow.Returns(1);
    expect(listing.status).to.equal(0);
  });

  it("should approve lot return", async function () {
    // Approve transfer
    await LotInformation.connect(buyer).approve(Escrow.target, 0);

    await Escrow.connect(buyer).returnLot(0);
    expect(await LotInformation.ownerOf(0)).to.equal(Escrow.target);

    await Escrow.connect(seller).approveLotReturn(0);
    expect(await LotInformation.ownerOf(0)).to.equal(seller.address);

    const listing = await Escrow.Returns(0);
    expect(listing.status).to.equal(1);
  });

  it("should approve batch return", async function () {
    // Approve transfer
    await ProductInformation.connect(buyer).approve(Escrow.target, 1);

    await Escrow.connect(buyer).returnBatch(1);
    expect(await ProductInformation.ownerOf(1)).to.equal(Escrow.target);

    await Escrow.connect(seller).approveBatchReturn(1);
    expect(await ProductInformation.ownerOf(1)).to.equal(seller.address);

    const listing = await Escrow.Returns(1);
    expect(listing.status).to.equal(1);
  });

  it("should deny lot return", async function () {
    // Approve transfer
    await LotInformation.connect(buyer).approve(Escrow.target, 0);

    await Escrow.connect(buyer).returnLot(0);
    expect(await LotInformation.ownerOf(0)).to.equal(Escrow.target);

    await Escrow.connect(seller).denyLotReturn(0);
    expect(await LotInformation.ownerOf(0)).to.equal(buyer.address);

    const listing = await Escrow.Returns(0);
    expect(listing.status).to.equal(2);
  });

  it("should deny batch return", async function () {
    // Approve transfer
    await ProductInformation.connect(buyer).approve(Escrow.target, 1);

    await Escrow.connect(buyer).returnBatch(1);
    expect(await ProductInformation.ownerOf(1)).to.equal(Escrow.target);

    await Escrow.connect(seller).denyBatchReturn(1);
    expect(await ProductInformation.ownerOf(1)).to.equal(buyer.address);

    const listing = await Escrow.Returns(1);
    expect(listing.status).to.equal(2);
  });

  it("should fail if trying to return non-existent lot", async function () {
    await expect(Escrow.returnLot(9999)).to.be.revertedWith("Lot does not exist");
  });

  it("should fail if trying to return non-existent batch", async function () {
    await expect(Escrow.returnBatch(9999)).to.be.revertedWith("Batch does not exist");
  });

  it("should fail if trying to approve lot return with incorrect seller", async function () {
    // Approve transfer
    await LotInformation.connect(buyer).approve(Escrow.target, 0);

    await Escrow.connect(buyer).returnLot(0);

    await expect(Escrow.connect(buyer).approveLotReturn(0)).to.be.revertedWith("Only seller can handle requests");
  });

  it("should fail if trying to approve batch return with incorrect seller", async function () {
    // Approve transfer
    await ProductInformation.connect(buyer).approve(Escrow.target, 1);

    await Escrow.connect(buyer).returnBatch(1);

    await expect(Escrow.connect(buyer).approveBatchReturn(1)).to.be.revertedWith("Only seller can handle requests");
  });

  it("should fail if trying to deny lot return with incorrect seller", async function () {
    // Approve transfer
    await LotInformation.connect(buyer).approve(Escrow.target, 0);

    await Escrow.connect(buyer).returnLot(0);

    await expect(Escrow.connect(buyer).denyLotReturn(0)).to.be.revertedWith("Only seller can handle requests");
  });

  it("should fail if trying to deny batch return with incorrect seller", async function () {
    // Approve transfer
    await ProductInformation.connect(buyer).approve(Escrow.target, 1);
  
    await Escrow.connect(buyer).returnBatch(1);

    await expect(Escrow.connect(buyer).denyBatchReturn(1)).to.be.revertedWith("Only seller can handle requests");
  });
});