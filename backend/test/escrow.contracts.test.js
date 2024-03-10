const { expect } = require("chai");
const { ethers } = require("hardhat");
const web3 = require('web3');

const tokens = (n) => {
  return web3.utils.toWei(n.toString(), "ether");
}

describe("Test listing and purchase", (accounts) => {
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
  });

  it("should allow manufacturer create a lot listing", async () => {
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, 50);

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(seller.address);

    // Approve transfer
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);

    // Check that product batch is owned by seller but lot is transferred to Escrow
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(Escrow.target);

    const listing = await Escrow.LotListings(0);
    
    expect(listing.seller).to.equal(seller);
    expect(listing.batchId).to.equal(0);
    expect(listing.pricePerUnit).to.equal(pricePerUnit);
  });

  it("should allow manufacturer create a batch listing", async () => {
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);

    // Approve transfer
    await ProductInformation.connect(seller).approve(Escrow.target, 0);

    await Escrow.connect(seller).createBatchListing(0, pricePerUnit);

    // Check that product batch is transferred to Escrow
    expect(await ProductInformation.ownerOf(0)).to.equal(Escrow.target);

    const listing = await Escrow.BatchListings(0);
    
    expect(listing.seller).to.equal(seller);
    expect(listing.batchId).to.equal(0);
    expect(listing.pricePerUnit).to.equal(pricePerUnit);
  });

  it("should not allow non owners create a lot listing", async () => {
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, 50);

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(seller.address);

    // Approve transfer
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    await expect(
      Escrow.connect(owner).createLotListing(0, 0, pricePerUnit)
    ).to.be.revertedWith("You are not the owner of this product batch");
  });

  it("should not allow non owners to create a batch listing", async () => {
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);

    // Approve transfer
    await ProductInformation.connect(seller).approve(Escrow.target, 0);

    await expect(
      Escrow.connect(owner).createBatchListing(0, pricePerUnit)
    ).to.be.revertedWith("You are not the owner of this product batch");
  });

  it("should not allow lot listing creation with zero price per unit", async () => {
    const pricePerUnit = 0;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, 50);

    // Approve transaction
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    await expect(
      Escrow.connect(seller).createLotListing(0, 0, pricePerUnit)
    ).to.be.revertedWith("Price per unit must be greater than zero");
  });

  it("should not allow batch listing creation with zero price per unit", async () => {
    const pricePerUnit = 0;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    // Approve transaction
    await ProductInformation.connect(seller).approve(Escrow.target, 0);

    await expect(
      Escrow.connect(seller).createBatchListing(0, pricePerUnit)
    ).to.be.revertedWith("Price per unit must be greater than zero");
  });

  it("should allow purchase of a lot listing", async () => {
    const batchSize = 100;
    const lotSize = 50;
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, lotSize);

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(seller.address);

    // Approve transaction
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    let createListingTx = await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(Escrow.target);

    await Escrow.connect(buyer).purchaseLot(0, { value: tokens(pricePerUnit * lotSize) });

    // Check that both the batch and lot are owned by the seller
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
    expect(await LotInformation.ownerOf(0)).to.equal(buyer.address);

    const listing = await Escrow.LotListings(0);
    expect(listing.isFulfilled).to.equal(true);
  });

  it("should allow purchase of a batch listing", async () => {
    const batchSize = 100;
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(batchSize, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    expect(await ProductInformation.ownerOf(0)).to.equal(seller.address);
  
    // Approve transaction
    await ProductInformation.connect(seller).approve(Escrow.target, 0);

    await Escrow.connect(seller).createBatchListing(0, pricePerUnit);
    expect(await ProductInformation.ownerOf(0)).to.equal(Escrow.target);

    await Escrow.connect(buyer).purchaseBatch(0, { value: tokens(pricePerUnit * batchSize) });
    expect(await ProductInformation.ownerOf(0)).to.equal(buyer.address);

    const listing = await Escrow.BatchListings(0);
    expect(listing.isFulfilled).to.equal(true);
  });

  it("should not allow purchase of a non-existent lot listing", async () => {
    await expect(
      Escrow.connect(buyer).purchaseLot(0, { value: tokens(100) })
    ).to.be.revertedWith("Lot does not exist");
  });

  it("should not allow purchase of a non-existent batch listing", async () => {
    await expect(
      Escrow.connect(buyer).purchaseBatch(0, { value: tokens(100) })
    ).to.be.revertedWith("Batch does not exist");
  });

  it("should not allow purchase of a fulfilled lot listing", async () => {
    const quantity = 5;
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, 50);

    // Approve transaction
    await LotInformation.connect(seller).approve(Escrow.target, 0);
  
    await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);

    await Escrow.connect(buyer).purchaseLot(0, { value: tokens(pricePerUnit * quantity) });

    await expect(
      Escrow.connect(buyer).purchaseLot(0, { value: tokens(pricePerUnit * quantity) })
    ).to.be.revertedWith("Listing is already fulfilled");
  });

  it("should not allow purchase of a fulfilled batch listing", async () => {
    const quantity = 5;
    const pricePerUnit = 1;

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    // Approve transaction
    await ProductInformation.connect(seller).approve(Escrow.target, 0);
  
    await Escrow.connect(seller).createBatchListing(0, pricePerUnit);

    await Escrow.connect(buyer).purchaseBatch(0, { value: tokens(pricePerUnit * quantity) });

    await expect(
      Escrow.connect(buyer).purchaseBatch(0, { value: tokens(pricePerUnit * quantity) })
    ).to.be.revertedWith("Listing is already fulfilled");
  });

  it("should not allow lot purchase with insufficient payment", async () => {
    const quantity = 5;
    const pricePerUnit = web3.utils.toWei("5", "ether");
    const insufficientPayment = web3.utils.toWei("2", "ether");

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await ProductInformation.connect(seller).createLot(0, 50);

    // Approve transaction
    await LotInformation.connect(seller).approve(Escrow.target, 0);

    await Escrow.connect(seller).createLotListing(0, 0, pricePerUnit);

    await expect(
      Escrow.connect(buyer).purchaseLot(0, { value: insufficientPayment })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("should not allow batch purchase with insufficient payment", async () => {
    const quantity = 5;
    const pricePerUnit = web3.utils.toWei("5", "ether");
    const insufficientPayment = web3.utils.toWei("2", "ether");

    await ProductInformation.connect(seller).createProductBatch(100, "2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    // Approve transaction
    await ProductInformation.connect(seller).approve(Escrow.target, 0);

    await Escrow.connect(seller).createBatchListing(0, pricePerUnit);

    await expect(
      Escrow.connect(buyer).purchaseBatch(0, { value: insufficientPayment })
    ).to.be.revertedWith("Insufficient payment");
  });
});
