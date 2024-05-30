import { Router } from 'express';
import { ethers } from 'ethers';
import web3 from 'web3';
import csrf from 'csurf';
import { AddressExtractor } from '../utils/middleware.utils.js';
import { validateLotListing, validateBatchListing, validatePurchase } from '../validators/escrow.validator.js';
import 'express-async-errors';

const tokens = (n) => {
  return web3.utils.toWei(n.toString(), "ether");
}

const Escrow = Router();
const csrfProtection = csrf({ cookie: true });

// POST /create-lot-listing
Escrow.post('/create-lot-listing', csrfProtection, AddressExtractor, validateLotListing, async (request, response) => {
  const { batchId, lotId, pricePerUnit } = request.body;

  try {
    await request.LotInformation.approve(request.Escrow.address, lotId);
    await request.Escrow.createLotListing(batchId, lotId, pricePerUnit);

    response.json({ message: 'Lot listing created successfully' });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      response.status(400).json({ error: revertReason });
    } else {
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

// POST /create-batch-listing
Escrow.post('/create-batch-listing', csrfProtection, AddressExtractor, validateBatchListing, async (request, response) => {
  const { batchId, pricePerUnit } = request.body;

  try {
    await request.ProductInformation.approve(request.Escrow.address, batchId);
    await request.Escrow.createBatchListing(batchId, pricePerUnit);

    response.json({ message: 'Batch listing created successfully' });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      // Handle the revert reason, e.g., return it in the response
      response.status(400).json({ error: revertReason });
    } else {
      // Handle other errors
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

// POST /purchase-lot
Escrow.post('/purchase-lot', csrfProtection, AddressExtractor, validatePurchase, async (request, response) => {
  const { listingId, amount } = request.body;

  try {
    // Call the purchaseLot function from the Escrow contract
    await request.Escrow.purchaseLot(listingId, {
      value: tokens(amount)
    });

    response.json({ message: 'Lot purchased successfully' });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      // Handle the revert reason, e.g., return it in the response
      response.status(400).json({ error: revertReason });
    } else {
      // Handle other errors
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

// POST /purchase-batch
Escrow.post('/purchase-batch', csrfProtection, AddressExtractor, validatePurchase, async (request, response) => {
  const { listingId, amount } = request.body;

  try {
    await request.Escrow.purchaseBatch(listingId, {
      value: tokens(amount)
    });

    response.json({ message: 'Batch purchased successfully' });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      // Handle the revert reason, e.g., return it in the response
      response.status(400).json({ error: revertReason });
    } else {
      // Handle other errors
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

export default Escrow;