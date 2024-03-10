// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./recall_management.contract.sol";
import "./quality_control.contract.sol";
import "./lot_information.contract.sol";
import "hardhat/console.sol";

interface ILotInformation {
  function registerBatch(uint256 _batchId, uint256 _batchSize) external;
  function createLot(uint256 _batchId, uint256 _lotSize, address _owner) external returns(uint256);
}

// Contract for managing the Product supply chain
contract ProductInformation is ERC721, RecallManagement, QualityControl {
  // Variable to track the next available Product ID
  uint256 private nextBatchId;
  address lotInformationContract;

  // Enum to represent Product status
  enum ProductStatus { InProduction, UnderInspection, InTransit, InDistribution, Sold, Recalled, Returned, Disposed }

  // Enum to represent inspection status
  enum InspectionStatus {Pending, Approved, Rejected}

  // Struct to represent Quality Inspection.
  struct Inspection {
    address inspector;
    InspectionStatus status;
    string inspectionDate;
    string authenticationCID; // IPFS CID for authenticity certificates provided by inspector
  }

  // Struct to represent a Product
  struct Product {
    uint256 batchSize;
    string manufacturingDate;
    string[] componentIds;
    uint256[] lots;
    address manufacturer;
    Inspection[] inspections;
    ProductStatus status;
    string metadataCID; // IPFS CID for metadata
  }

  // Mapping to store Product by ProductId
  mapping(uint256 => Product) public ProductBatches;

  // Modifier to restrict access to certain functions
  modifier onlyBatchOwner(uint256 _batchId) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");
    require(msg.sender == ownerOf(_batchId), "Only the owner can call this function");
    _;
  }

  // Event emitted when a new Product batch is created
  event ProductCreated(uint256 indexed productId, address indexed manufacturer);

  // Event emitted when an inspection is updated
  event InspectionUpdated(uint256 indexed ProductId, uint256 indexed inspectionIndex, address indexed inspector, InspectionStatus status);

  // Event emitted when an ownership is changed
  event BatchOwnershipChanged(uint256 indexed ProductId, address indexed prev_owner, address curr_owner);

  // Event emitted when a product batch is recalled
  event ProductRecalled(uint256 indexed batchId, string reason, address initiator);

  // constructor() ERC721("ProductInformationContract", "PIC") {}
  constructor(address _lotInformationContract) ERC721("ProductInformationContract", "PIC") {
    lotInformationContract = _lotInformationContract; // Initialize ProductInformation contract
  }

  // Function to create a new Product batch
  function createProductBatch(
    uint256 _batchSize,
    string memory _manufacturingDate,
    string[] memory _componentIds,
    string memory _metadataCID
  ) public returns (uint256) {
    uint256 _batchId = nextBatchId;
    nextBatchId++;

    // Chack passed data
    require(bytes(_manufacturingDate).length > 0, "Manufacturing date cannot be empty");

    // Create a new Product batch
    Product storage newBatch = ProductBatches[_batchId];
    newBatch.batchSize = _batchSize;
    newBatch.manufacturingDate = _manufacturingDate;
    newBatch.componentIds = _componentIds;
    newBatch.manufacturer = msg.sender;
    newBatch.status = ProductStatus.InProduction;
    newBatch.metadataCID = _metadataCID;

    ILotInformation(lotInformationContract).registerBatch(_batchId, _batchSize);

    // Mint a new NFT representing the Product
    _safeMint(msg.sender, _batchId);

    // Emit event
    emit ProductCreated(_batchId, msg.sender);
    return _batchId;
  }

  // Function get batch size
  function getBatchSize(uint256 _batchId) external view returns(uint256) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    return (ProductBatches[_batchId].batchSize);
  }

  // Function to create a lot and establish ownership.
  function createLot(uint256 _batchId, uint256 _lotSize) external onlyBatchOwner(_batchId) returns(uint256) {
    require(_lotSize > 0, "Lot size cannot be less than 1");

    uint256 _lotId = ILotInformation(lotInformationContract).createLot(_batchId, _lotSize, msg.sender);
  
    emit ProductCreated(_batchId, msg.sender);
    return _lotId;
  }

  // Function to update the status of a Product batch
  function updateBatchStatus(uint256 _batchId, ProductStatus _status) public onlyBatchOwner(_batchId) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    ProductBatches[_batchId].status = _status;
  }

  // Function to set inspection status of a Product to pending
  function addInspector(uint256 _batchId, address _inspector, string memory _inspectionDate, string memory _metadataCID) public onlyBatchOwner(_batchId) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    Product storage product = ProductBatches[_batchId];
    uint256 _inspectionIndex = product.inspections.length;

    if (_inspector != address(0)) {
      product.inspections.push(Inspection(_inspector, InspectionStatus.Pending, _inspectionDate, _metadataCID));
      emit InspectionUpdated(_batchId, _inspectionIndex, _inspector, InspectionStatus.Pending);
    }
  }

  // Function to get the current inspection status of a Product
  function getInspectionStatus(uint256 _batchId) public view returns (uint256, Inspection[] memory) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    Product storage product = ProductBatches[_batchId];
    return (product.inspections.length, product.inspections);
  }

  // Function to update the inspection status of a Product
  function updateInspection(uint256 _batchId, InspectionStatus _status, string memory _inspectionDate) public {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    Product storage product = ProductBatches[_batchId];
    uint256 _inspectionIndex = 0;
    for (uint256 i = 0; i < product.inspections.length; i++) {
      if (product.inspections[i].inspector == msg.sender) {
        _inspectionIndex = i;
        break;
      }
    }
    require(_inspectionIndex < product.inspections.length, "Inspection not found");
    require(product.inspections[_inspectionIndex].inspector == msg.sender, "Only the assigned inspector can update inspection status");
    product.inspections[_inspectionIndex].status = _status;
    product.inspections[_inspectionIndex].inspectionDate = _inspectionDate;
    emit InspectionUpdated(_batchId, _inspectionIndex, msg.sender, _status);
  }

  // Function to allow manufaturers to recall products
  function recallProductBatch(uint256 _batchId, string memory _reasonCID) public {
    require(ProductBatches[_batchId].manufacturer != address(0), "Product does not exist");

    ProductBatches[_batchId].status = ProductStatus.Recalled;
    recallProduct(_batchId, _reasonCID);
    
    emit ProductRecalled(_batchId, _reasonCID, msg.sender);
  }
}
