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

  await api.post('/api/product-information/create-product-batch').send({batchSize: 500, manufacturingDate: '2024-03-24', componentIds: [1, 2, 3], metadata: {}}).set('private-key', seller).set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);
  await api.post('/api/product-information/create-product-batch').send({batchSize: 500, manufacturingDate: '2024-03-24', componentIds: [1, 2, 3], metadata: {}}).set('private-key', seller).set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);
  await api.post('/api/product-information/create-lot').send({batchId: 2, lotSize: 5}).set('private-key', seller).set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);
}, 100000);

describe('Escrow API', () => {
  it('It should respond with a success message', async () => {
    const response = await api
      .post('/api/escrow/create-lot-listing')
      .send({
        batchId: 2,
        lotId: 2,
        pricePerUnit: 10
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toBe('Lot listing created successfully');
  }, 100000);

  it('It should revert when non-existent ID is passed', async () => {
    const response = await api
      .post('/api/escrow/create-lot-listing')
      .send({
        batchId: 500,
        lotId: 2,
        pricePerUnit: 10
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
  }, 100000);

  it('should return 400 when invalid batchId is passed', async () => {
    const response = await api
      .post('/api/escrow/create-lot-listing')
      .send({
        batchId: -1,
        lotId: 2,
        pricePerUnit: 50
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error[0]).toEqual('ID must be a positive number');
  }, 100000);

  it('should create a batch listing and respond with a success message', async () => {
    const response = await api
      .post('/api/escrow/create-batch-listing')
      .send({
        batchId: 3,
        pricePerUnit: 100
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body.message).toBe('Batch listing created successfully');
  }, 100000);

  it('should handle revert reasons correctly', async () => {
    const response = await api
      .post('/api/escrow/create-batch-listing')
      .send( {
        batchId: 3,
        pricePerUnit: -50,
      })
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error[0]).toEqual('Price must be a positive number');
  }, 100000);

  it('should respond with a success message when lot is purchased successfully', async () => {
    // Mock request body and expected response
    const requestBody = { listingId: 2, amount: '10.0' };
    const expectedResponse = { message: 'Lot purchased successfully' };

    // Send a POST request to the endpoint
    const response = await api
      .post('/api/escrow/purchase-lot')
      .send(requestBody)
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  }, 100000);

  it('should respond with an error message when lot purchase fails', async () => {
    const requestBody = { listingId: 2, amount: '1.0' };

    // Send a POST request to the endpoint
    const response = await api
      .post('/api/escrow/purchase-lot')
      .send(requestBody)
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
  }, 100000);

  it('should respond with an error message for invalid input data', async () => {
    const requestBody = { amount: '1.0' };

    const response = await supertest(app)
      .post('/api/escrow/purchase-lot')
      .send(requestBody)
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error).toEqual('"listingId" is required');
  }, 100000);

  it('should respond with a success message when batch is purchased successfully', async () => {
    const requestBody = { listingId: 3, amount: '10.0' };
    const expectedResponse = { message: 'Batch purchased successfully' };

    const response = await api
      .post('/api/escrow/purchase-batch')
      .send(requestBody)
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  }, 100000);

  it('should respond with an error message when batch purchase fails', async () => {
    await api.post('/api/product-information/create-product-batch').send({batchSize: 500, manufacturingDate: '2024-03-24', componentIds: [1, 2, 3], metadata: {}}).set('private-key', seller).set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);
    await api.post('/api/escrow/create-batch-listing').send({batchId: 3,cpricePerUnit: 100}).set('private-key', seller).set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);

    const requestBody = { listingId: 4, amount: '1.0' };
    const response = await api
      .post('/api/escrow/purchase-batch')
      .send(requestBody)
      .set('private-key', seller)
      .set('Cookie', csrfCookie)
      .set('x-csrf-token', csrfToken)
      .expect(400);

    expect(response.body.error).toBeDefined();
  }, 100000);
});