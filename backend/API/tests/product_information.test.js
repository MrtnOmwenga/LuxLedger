import supertest from 'supertest';
import app from '../server.js';

const api = supertest(app);

let csrfToken; // To store the CSRF token globally
let csrfCookie; // To store the CSRF cookie globally
const seller = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const buyer = ' 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

beforeAll(async () => {
  // Get CSRF token
  const csrfResponse = await api.get('/services/csrf');
  csrfToken = csrfResponse.body.csrfToken;
  csrfCookie = csrfResponse.headers['set-cookie'];
}, 100000);

describe('ProductInformation API', () => {
  const metadata = {
    "manufacturer": "Company A",
    "location": "Factory A",
    "imageCID": "QmX5RuYLZTg9M8LXtr8U5iRCmCvjm7xDyv1e8SeC7UH21N",
    "logistics": [
      {
        "shippingDate": "2024-03-14",
        "shippingFrom": "Factory A",
        "shippingTo": "Warehouse B",
        "carrier": "Carrier Corp",
        "trackingNumber": "1234567890",
        "deliveryConfirmed": true,
        "deliveryConfirmationCID": "QmWALzN6vQZ1Emz7pUjKGx95hVXbGJw3iAFr6n1QDm1GwJ"
    }
    ]
  };

  it('should create a product batch', async () => {
    const response = await api
      .post('/api/product-information/create-product-batch')
      .send({
        batchSize: 500,
        manufacturingDate: '2024-03-24',
        componentIds: [1, 2, 3],
        metadata,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toEqual('Product batch created successfully');
  }, 100000);

  it('should return an error when creating a product batch with invalid data', async () => {
    const response = await api
      .post('/api/product-information/create-product-batch')
      .send({
        batchSize: 100,
        manufacturingDate: '2024-03-24',
        componentIds: [1, 2, 3],
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual("Metadata is required");
  }, 100000);

  it('should return an error when creating a product batch with invalid data', async () => {
    const response = await api
      .post('/api/product-information/create-product-batch')
      .send({
        batchSize: -1,
        manufacturingDate: '2024-03-24',
        componentIds: [1, 2, 3],
        metadata
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual('"batchSize" must be a positive number');
  }, 100000);

  it('should return an error when creating a product batch without address', async () => {
    const response = await api
      .post('/api/product-information/create-product-batch')
      .send({
        batchSize: 100,
        manufacturingDate: '2024-03-24',
        componentIds: [1, 2, 3],
      })
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual('Private key is required');
  }, 100000);

  it('should return an error when creating a product batch without csrf token and carf cookie', async () => {
    const response = await api
      .post('/api/product-information/create-product-batch')
      .send({
        batchSize: 100,
        manufacturingDate: '2024-03-24',
        componentIds: [1, 2, 3],
      })
      .set('private-key', seller)
      .expect(403);

    expect(response.body).toHaveProperty('error');
  }, 100000);

  it('should create a lot', async () => {
    const response = await api
      .post('/api/product-information/create-lot')
      .send({
        batchId: 2,
        lotSize: 5
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toEqual('Lot created successfully');
  }, 100000);

  it('should return an error when creating a lot with invalid data', async () => {
    const response = await api
      .post('/api/product-information/create-lot')
      .send({
        batchId: 1,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual("Lot size is required");
  }, 100000);

  it('should update batch status', async () => {
    const response = await api
      .post('/api/product-information/update-batch-status')
      .send({
        batchId: 2,
        status: 2
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toEqual('Batch status updated successfully');
  }, 100000);

  it('should return an error when updating batch status with invalid data', async () => {
    const response = await api
      .post('/api/product-information/update-batch-status')
      .send({
        batchId: 1,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual("Status is required");
  }, 100000);

  it('should return an error when updating batch status with invalid data', async () => {
    const response = await api
      .post('/api/product-information/update-batch-status')
      .send({
        batchId: -1,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error[0]).toEqual('ID must be a positive number');
  }, 100000);

  it('It should respond with a success message', async () => {
    const response = await api
      .post('/api/product-information/recall-product')
      .send({
        batchId: 2,
        reason: { message: 'Expired product' }
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toBe('Product recalled successfully');
  }, 100000);

  it('It should respond with a 400 error for missing batchId', async () => {
    const response = await api
      .post('/api/product-information/recall-product')
      .send({
        reason: { message: 'Expired product' }
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    // Assert that the response contains the validation error message
    expect(response.body.error[0]).toBe("ID is required");
  }, 100000);

  it('It should respond with a success message', async () => {
    const response = await api
      .post('/api/product-information/report-defect')
      .send({
        batchId: 1,
        description: { message: 'Expired product' }
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toBe('Defect reported successfully');
  }, 100000);

  it('It should respond with a 400 error for missing batchId', async () => {
    const response = await api
      .post('/api/product-information/report-defect')
      .send({
        description: { message: 'Expired product' }
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error[0]).toBe("ID is required");
  }, 100000);

  it('It should respond with a success message', async () => {
    const response = await api
      .post('/api/product-information/resolve-recall')
      .send({
        recallId: 2,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toBe('Recall resolved successfully');
  }, 100000);

  it('It should respond with a 400 error for invalid recallId', async () => {
    const response = await api
      .post('/api/product-information/resolve-recall')
      .send({
        recallId: -1
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error[0]).toBe("ID must be a positive number");
  }, 100000);
});