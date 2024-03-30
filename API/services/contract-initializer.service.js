import { ethers } from 'ethers';
import config from '../utils/config.utils';
import * as productInformationABI from '../ABIs/product_information.contract.sol/ProductInformation.json' with { type: "json" };
import * as lotInformationABI from '../ABIs/lot_information.contract.sol/LotInformation.json' with { type: "json" };
import * as escrowABI from '../ABIs/escrow.contract.sol/Escrow.json' with { type: "json" };

// Connect to Ethereum network
export const provider = new ethers.providers.JsonRpcProvider(config.PROVIDER_URL);

// Instantiate ProductInformation contract
export const productInformationContract = new ethers.Contract(config.PRODUCT_INFORMATION, productInformationABI.default, provider);
export const lotInformationContract = new ethers.Contract(config.LOT_INFORMATION, lotInformationABI.default, provider);
export const escrowContract = new ethers.Contract(config.ESCROW, escrowABI.default, provider);

// Define the event to listen for
const PRODUCT_CREATED = 'ProductCreated';
const INSPECTION_UPDATED = 'InspectionUpdated';
const PRODUCT_RECALLED = 'ProductRecalled';

const LOT_CREATED = 'LotCreated';

// Listen for the event
productInformationContract.on(PRODUCT_CREATED, async (productId, manufacturer, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('PRODUCT CREATED:', {
    'Batch ID': productId.toString(),
    'Manufacturer': manufacturer,
    'From': tx.from
  });
});

productInformationContract.on(PRODUCT_RECALLED, async (batchId, manufacturer, reason, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('PRODUCT RECALLED:', {
    'Batch ID': batchId.toString(),
    'Manufacturer': manufacturer,
    'Reason': reason,
    'From': tx.from
  });
});

productInformationContract.on(INSPECTION_UPDATED, async (productId, inspectionIndex, inspector, status, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('INSPECTION UPDATED:', {
    'Batch ID': productId.toString(),
    'Inspection Index': inspectionIndex.toString(),
    'Inspector': inspector,
    'Status': status,
    'From': tx.from
  });
});

lotInformationContract.on(LOT_CREATED, async (lotId, batchId, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('LOT CREATED:', {
    'Lot ID': lotId.toString(),
    'Batch ID': batchId.toString(),
    'From': tx.from
  });
});

// Listen for LotListingCreated event
escrowContract.on('LotListingCreated', async (listingId, seller, batchId, lotId, pricePerUnit, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('LOT LISTING CREATED:', {
    'Listing ID': listingId.toString(),
    'Seller': seller,
    'Batch ID': batchId.toString(),
    'Lot ID': lotId.toString(),
    'Price Per Unit': pricePerUnit.toString(),
    'From': tx.from
  });
});

// Listen for BatchListingCreated event
escrowContract.on('BatchListingCreated', async (listingId, seller, batchId, pricePerUnit, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('BATCH LISTING CREATED:', {
    'Listing ID': listingId.toString(),
    'Seller': seller,
    'Batch ID': batchId.toString(),
    'Price Per Unit': pricePerUnit.toString(),
    'From': tx.from
  });
});

// Listen for PurchaseConfirmed event
escrowContract.on('PurchaseConfirmed', async (listingId, buyer, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('PURCHASE CONFIRMED:', {
    'Listing ID': listingId.toString(),
    'Buyer': buyer,
    'From': tx.from
  });
});

// Listen for ProductReturned event
escrowContract.on('ProductReturned', async (listingId, buyer, seller, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('PRODUCT RETURNED:', {
    'Listing ID': listingId.toString(),
    'Buyer': buyer,
    'Seller': seller,
    'From': tx.from
  });
});

// Listen for ReturnApproved event
escrowContract.on('ReturnApproved', async (listingId, buyer, seller, event) => {
  const tx = await provider.getTransaction(event.transactionHash);
  console.log('RETURN APPROVED:', {
    'Listing ID': listingId.toString(),
    'Buyer': buyer,
    'Seller': seller,
    'From': tx.from
  });
});
