# Smart Supply

## Description

**SmartSupply** is a versatile REST API designed to seamlessly integrate into any system, providing comprehensive product tracking capabilities using blockchain technology. With a focus on ensuring the integrity and traceability of products throughout their lifecycle, SmartSupply offers a robust solution for businesses seeking to enhance transparency and trust in their supply chain operations.

### Key Features

- **Blockchain Integration**: Leveraging blockchain technology, SmartSupply enables immutable and transparent tracking of product data, ensuring tamper-proof records of product provenance and authenticity.
  
- **Flexible Integration**: SmartSupply is built with flexibility in mind, offering RESTful endpoints that can be easily integrated into existing systems and workflows, regardless of the technology stack.
  
- **Product Lifecycle Management**: From batch creation to inspection updates and product recalls, SmartSupply provides comprehensive functionality for managing the entire product lifecycle, enhancing visibility and control over critical processes.

- **Secure and Scalable**: With robust security measures and scalable architecture, SmartSupply is designed to meet the evolving needs of businesses of all sizes, ensuring data integrity and availability even as the system grows.

- **Easy Deployment**: SmartSupply can be deployed locally for development and testing purposes or scaled for production deployment using Docker containers, making it accessible and adaptable to various deployment scenarios.

### Use Cases

- **Supply Chain Management**: SmartSupply empowers businesses to track products from manufacturing to delivery, enabling real-time visibility into the movement and status of goods across the supply chain.

- **Quality Assurance**: By recording inspection updates and product recalls on the blockchain, SmartSupply enhances quality assurance processes, enabling quick identification and resolution of quality issues.

- **Regulatory Compliance**: With immutable records of product data and transactions, SmartSupply facilitates compliance with regulatory requirements, providing auditable evidence of adherence to industry standards.

### Seamless Integration

SmartSupply's REST API can be seamlessly integrated into a wide range of systems and applications, including:

- Enterprise Resource Planning (ERP) systems
- Customer Relationship Management (CRM) software
- Warehouse Management Systems (WMS)
- E-commerce platforms
- IoT devices and sensors

By providing standardized endpoints and comprehensive documentation, SmartSupply simplifies the process of integrating blockchain-based product tracking capabilities into existing business workflows, empowering organizations to drive efficiency, transparency, and trust across their supply chains.


## Other Relevant Features

- Secure authentication and authorization using CSRF tokens and session management.
- Cross-origin resource sharing (CORS) enabled for handling requests from different origins.
- Protection against cross-site scripting (XSS) attacks using the `xss-clean` middleware.
- Implementation of Content Security Policy (CSP) headers for enhancing security against malicious scripts.
- Rate limiting to prevent abuse and denial-of-service attacks.
- Error handling middleware for handling CSRF token errors and other runtime errors gracefully.
- Comprehensive logging using request logging middleware for debugging and monitoring purposes.
- Integration with Ethereum smart contracts for managing escrow services.

## Technologies Used

- **Express.js**: Backend web application framework for Node.js.
- **Joi**: Schema validation library for validating request data.
- **CSRF Protection**: Protection against cross-site request forgery (CSRF) attacks using csurf middleware.
- **Session Management**: Express session middleware for managing user sessions and authentication.
- **Helmet**: Middleware for securing Express apps by setting various HTTP headers.
- **Ethers.js**: JavaScript library for interacting with Ethereum blockchain and smart contracts.
- **MongoDB**: NoSQL database for storing application data.
- **Docker**: Containerization tool for packaging the application into containers.
- **NGINX**: Reverse proxy server for load balancing and handling HTTPS connections.
- **AWS**: Cloud platform for deploying and hosting the application.

## Installation

1. Clone the repository:

git clone https://github.com/MrtnOmwenga/SmartSupply.git

2. Install dependencies:

npm install

3. Configure environment variables:

Create a .env file in the root directory and add the following environment variables:

PROVIDER_URL=<Your provider URL>
PRIVATE_KEY=<Your Private Key>
PORT=3000
SECRET=<Your secret key>
LOT_INFORMATION=<Your lot information contract address>
PRODUCT_INFORMATION=<Your product information contract address>
ESCROW=<Your escrow contract address>

4. Start the server:

npm start

## Usage

1. Obtain CSRF token:

Send a GET request to /services/csrf to obtain a CSRF token.

2. Use CSRF token:

Include the CSRF token in the headers of subsequent requests as x-csrf-token.

3. Access API endpoints:

Access the API endpoints for managing product information and escrow services.

## Deployment

### Local Development

For local development, you can run the application using npm start and access the API endpoints at http://localhost:3000.

### Production Deployment

For production deployment, follow these steps:

1. Build the Docker image:

docker build -t <image-name> .

2. Run the Docker container:

docker run -d -p 3000:3000 <image-name>

3. Configure NGINX:

Set up NGINX as a reverse proxy server to forward requests to the Express application. Configure SSL/TLS certificates for HTTPS connections.

4. Deploy on AWS:

Deploy the application on AWS using services like EC2 for hosting the Docker containers, RDS for MongoDB, and Elastic Load Balancer (ELB) for load balancing.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
