// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Contract for managing the record supply chain
contract SupplyChainContract is ERC721, Ownable {
  // Variable to track the next available record ID
  uint256 private nextBatchId;

  // Enum to represent record status
  enum ProductStatus { InProduction, UnderInspection, InTransit, InDistribution, Sold, Recalled, Disposed }

  // Enum to represent inspection status
  enum InspectionStatus {Pending, Approved, Rejected}

  // Enum to represent owner types
  enum OwnerType {Manufacturer, Distributor, Retailer, Consumer}

  // Struct to represent Quality Inspection.
  struct Inspection {
    address inspector;
    InspectionStatus status;
    string inspectionDate;
    string authenticationCID; // IPFS CID for authenticity certificates provided by inspector
  }

  // Struct to represent a record
  struct Product {
    uint256 batchId;
    string manufacturingDate;
    string[] componentIds;
    address manufacturer;
    Inspection[] inspections;
    address distributor;
    address retailer;
    ProductStatus status;
    string metadataCID; // IPFS CID for metadata
  }

  // Mapping to store record by recordId
  mapping(uint256 => Product) public ProductBatches;

  // Modifier to restrict access to certain functions
  modifier onlyBatchOwner(uint256 _batchId) {
    require(ProductBatches[_batchId].manufacturer != address(0), "Record does not exist");
    require(msg.sender == ownerOf(_batchId), "Only the owner can call this function");
    _;
  }

  // Event emitted when a new record batch is created
  event ProductCreated(uint256 indexed productId, address indexed manufacturer);

  // Event emitted when an inspection is updated
  event InspectionUpdated(uint256 indexed recordId, uint256 indexed inspectionIndex, address indexed inspector, InspectionStatus status);

  // Event emitted when an ownership is changed
  event OwnershipChanged(uint256 indexed recordId, address indexed prev_owner, address curr_owner);

  constructor(address initialOwner) Ownable(initialOwner) ERC721("RecordNFT", "RNFT") {}

  // Function to create a new record batch
  function createProductBatch(
    string memory _manufacturingDate,
    string[] memory _componentIds,
    string memory _metadataCID // IPFS CID for metadata
  ) public returns (uint256) {
    uint256 _batchId = nextBatchId;
    nextBatchId++;

    // Chack passed data
    require(bytes(_manufacturingDate).length > 0, "Manufacturing date cannot be empty");

    // Create a new record batch
    Product storage newBatch = ProductBatches[_batchId];
    newBatch.batchId = _batchId;
    newBatch.manufacturingDate = _manufacturingDate;
    newBatch.componentIds = _componentIds;
    newBatch.manufacturer = msg.sender;
    newBatch.status = ProductStatus.InProduction;
    newBatch.metadataCID = _metadataCID;

    // Mint a new NFT representing the record
    _mint(msg.sender, _batchId);

    _transfer(ownerOf(_batchId), msg.sender, _batchId);

    // Emit event
    emit ProductCreated(_batchId, msg.sender);
    return _batchId;
  }

  // Function to update the status of a record batch
  function updateBatchStatus(uint256 _batchId, ProductStatus _status) public onlyBatchOwner(_batchId) {
    ProductBatches[_batchId].status = _status;
  }

  // Function to set inspection status of a record to pending
  function addInspector(uint256 _batchId, address _inspector, string memory _inspectionDate, string memory _metadataCID) public onlyBatchOwner(_batchId) {
    Product storage product = ProductBatches[_batchId];
    uint256 _inspectionIndex = product.inspections.length;
    if (_inspector != address(0)) {
      product.inspections.push(Inspection(_inspector, InspectionStatus.Pending, _inspectionDate, _metadataCID));
      emit InspectionUpdated(_batchId, _inspectionIndex, _inspector, InspectionStatus.Pending);
    }
  }

  // Function to get the current inspection status of a record
  function getInspectionStatus(uint256 _batchId) public view returns (uint256, Inspection[] memory) {
    Product storage product = ProductBatches[_batchId];
    return (product.inspections.length, product.inspections);
  }

  // Function to update the inspection status of a record
  function updateInspection(uint256 _batchId, InspectionStatus _status, string memory _inspectionDate) public {
    require(ProductBatches[_batchId].manufacturer != address(0), "Record does not exist");

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

  // Function to transfer ownership of a record NFT
  function transferBatchOwnership(uint256 _batchId, address _to, OwnerType _ownerType) public onlyBatchOwner(_batchId) {
    Product storage product = ProductBatches[_batchId];

    // Transfer ownership
    _transfer(msg.sender, _to, _batchId);

    // Update product status and addresses based on owner type
    if (_ownerType == OwnerType.Distributor) {
      product.distributor = _to;
      product.status = ProductStatus.InDistribution;
    } else if (_ownerType == OwnerType.Retailer) {
      product.retailer = _to;
      product.status = ProductStatus.Sold;
    } else if (_ownerType == OwnerType.Consumer) {
      product.status = ProductStatus.Sold;
    }

    emit OwnershipChanged(_batchId, ownerOf(_batchId), _to);
  }
}
