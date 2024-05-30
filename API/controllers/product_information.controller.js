import { Router } from 'express';
import csrf from 'csurf';
import { AddressExtractor } from '../utils/middleware.utils.js';
import { validateCreateProductBatch, validateCreateLot, validateUpdateBatchStatus, validateAddInspector, validateUpdateInspection, validateRecallProduct,  validateReportDefect, validateResolveRecall } from '../validators/product_information.validator.js';
import 'express-async-errors';

const ProductInformation = Router();
const csrfProtection = csrf({ cookie: true });

// Define route to create product batch
ProductInformation.get('/:id', AddressExtractor, async (request, response) => {
  const id = request.params.id;

  try {
    const product = await request.ProductInformation.ProductBatches(id);
    const [componentCount, components] = await request.ProductInformation.getComponents(id);
    const [lotCount, lots] = await request.ProductInformation.getLots(id);
    const [inspectionCount, inspections] = await request.ProductInformation.getInspectionStatus(id);

    let lotInformation = [];
    for (let i = 0; i < lotCount; i++) {
      const lotSize = await request.ProductInformation.getLotSize(lots[i].toNumber());
      lotInformation.push({ lotId: lots[i].toNumber(), lotSize: lotSize.toNumber()});
    }

    return response.json({
      "batchSize": product.batchSize.toNumber(),
      "manufacturingDate": product.manufacturingDate,
      "componentIds": components.map((componentId) => componentId.toNumber()),
      "lots": lotInformation,
      "manufacturer": product.manufacturer,
      "inspections": inspections,
      "status": product.status,
      "metadataCID": product.metadataCID
    });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      response.status(400).json({ error: revertReason });
    } else {
      // Handle other errors
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

// POST /create-product-batch
ProductInformation.post('/create-product-batch', csrfProtection, AddressExtractor, validateCreateProductBatch, async (request, response) => {
  const { batchSize, manufacturingDate, componentIds, metadata } = request.body;

  try {
    // Call the createProductBatch function from the ProductInformation contract
    await request.ProductInformation.createProductBatch(batchSize, manufacturingDate, componentIds, metadataCID);

    return response.status(200).send({ message: 'Product batch created successfully' });
  } catch (error) {
    if (error.message.includes("revert")) {
      const revertReason = error.message.split("reverted with")[1].trim();
      response.status(400).json({ error: revertReason });
    } else {
      // Handle other errors
      console.error("Transaction failed with error:", error.message);
      response.status(500).json({ error: "Transaction failed" });
    }
  }
});

// POST /create-lot
ProductInformation.post('/create-lot', csrfProtection, AddressExtractor, validateCreateLot, async (request, response) => {
  const { batchId, lotSize } = request.body;

  try {  
    // Call the createLot function from the ProductInformation contract
    await request.ProductInformation.createLot(batchId, lotSize);

    response.json({ message: 'Lot created successfully' });
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

// POST /update-batch-status
ProductInformation.post('/update-batch-status', csrfProtection, AddressExtractor, validateUpdateBatchStatus, async (request, response) => {
  const { batchId, status } = request.body;

  try {
    // Call the updateBatchStatus function from the ProductInformation contract
    await request.ProductInformation.updateBatchStatus(batchId, status);

    response.json({ message: 'Batch status updated successfully' });
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

// POST /add-inspector
ProductInformation.post('/add-inspector', csrfProtection, AddressExtractor, validateAddInspector, async (request, response) => {
  const { batchId, inspector } = request.body;

  try {
    // Call the addInspector function from the ProductInformation contract
    await request.ProductInformation.addInspector(batchId, inspector, "");

    response.json({ message: 'Inspector added successfully' });
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

// POST /update-inspection
ProductInformation.post('/update-inspection', csrfProtection, AddressExtractor, validateUpdateInspection, async (request, response) => {
  const { batchId, status, inspectionDate, authentication } = req.body;

  try {
    // Call the updateInspection function from the ProductInformation contract
    await request.ProductInformation.updateInspection(batchId, status, inspectionDate, authenticationCID);

    response.json({ message: 'Inspection updated successfully' });
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

// POST /recall-product
ProductInformation.post('/recall-product', csrfProtection, AddressExtractor, validateRecallProduct, async (request, response) => {
  const { batchId, reason } = request.body;

  try {
    // Call the recallProductBatch function from the ProductInformation contract
    await request.ProductInformation.recallProductBatch(batchId, reasonCID);

    response.json({ message: 'Product recalled successfully' });
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

// POST /report-defect
ProductInformation.post('/report-defect', csrfProtection, AddressExtractor, validateReportDefect, async (request, response) => {
  const { batchId, description } = request.body;

  try {
    // Call the reportDefect function from the QualityControl contract
    await request.ProductInformation.reportDefect(batchId, descriptionCID);

    response.json({ message: 'Defect reported successfully' });
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

// POST /resolve-recall
ProductInformation.post('/resolve-recall', csrfProtection, AddressExtractor, validateResolveRecall, async (request, response) => {
  const { recallId } = request.body;

  try {
    // Call the resolveRecall function from the RecallManagement contract
    await request.ProductInformation.resolveRecall(recallId);

    response.json({ message: 'Recall resolved successfully' });
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

export default ProductInformation;