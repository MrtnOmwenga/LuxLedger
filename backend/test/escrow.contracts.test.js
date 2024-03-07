const { expect } = require("chai");
const { ethers } = require("hardhat");
const web3 = require('web3');

const tokens = (n) => {
  return web3.utils.toWei(n.toString(), "ether");
}

describe("Escrow", (accounts) => {
  let Escrow;
  let ProductInformation;
  let owner
  let seller;
  let buyer;

  beforeEach(async () => {
    [owner, seller, buyer] = await ethers.getSigners();

    const productInformationInstance = await ethers.getContractFactory("ProductInformation");
    ProductInformation = await productInformationInstance.deploy(owner);

    // Deploy Escrow contract with the address of the ProductInformation contract
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    Escrow = await EscrowFactory.deploy(ProductInformation.target);
  });

  it("should allow manufacturer create a listing", async () => {
    const quantity = 5;
    const pricePerUnit = web3.utils.toWei("1", "ether");

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    console.log("Before: ", await Escrow.connect(seller).getBatchOwner(product.value));
    console.log("Contract: ", seller.address);
    const tx = await Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit);
    console.log("After: ", await Escrow.connect(seller).getBatchOwner(product.value));
    console.log("Contract: ", Escrow.target);

    const listing = await Escrow.listings(tx.value);
    
    expect(listing.seller).to.equal(seller);
    expect(listing.batchId).to.equal(product.value);
    expect(listing.quantity).to.equal(quantity);
    expect(listing.pricePerUnit).to.equal(pricePerUnit);
  });

  it("should not allow listing creation with zero quantity", async () => {
    const quantity = 0;
    const pricePerUnit = web3.utils.toWei("1", "ether");

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    await expect(
      Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit)
    ).to.be.revertedWith("Quantity must be greater than zero");
  });

  it("should not allow listing creation with zero price per unit", async () => {
    const quantity = 5;
    const pricePerUnit = 0;

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");

    await expect(
      Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit)
    ).to.be.revertedWith("Price per unit must be greater than zero");
  });

  it("should allow purchase of a listing", async () => {
    const quantity = 5;
    const pricePerUnit = 1;

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    let tx = await Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit);

    console.log("productBatchOwner called directly: ", await ProductInformation.connect(seller).productBatchOwner(product.value));
    console.log("getBatchOwner called from Escrow", await Escrow.connect(seller).getBatchOwner(product.value));

    const result = await Escrow.getBalance();

    tx = await Escrow.connect(buyer).purchase(tx.value, { value: tokens(pricePerUnit * quantity) });

    const listing = await Escrow.listings(tx.value);

    const resultAfter = await Escrow.getBalance();
  });

  it("should not allow purchase of a fulfilled listing", async () => {
    const quantity = 5;
    const pricePerUnit = 1;

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit);

    await Escrow.connect(buyer).purchase(0, { value: tokens(pricePerUnit * quantity) });

    await expect(
      Escrow.connect(buyer).purchase(0, { value: tokens(pricePerUnit * quantity) })
    ).to.be.revertedWith("Listing is already fulfilled");
  });

  it("should not allow purchase with insufficient payment", async () => {
    const quantity = 5;
    const pricePerUnit = web3.utils.toWei("1", "ether");
    const insufficientPayment = web3.utils.toWei("2", "ether");

    const product = await ProductInformation.connect(seller).createProductBatch("2022-03-01", ["component1", "component2"], "ipfs://Qm...");
    await Escrow.connect(seller).createListing(product.value, quantity, pricePerUnit);

    await expect(
      Escrow.connect(buyer).purchase(0, { value: insufficientPayment })
    ).to.be.revertedWith("Insufficient payment");
  });
});
