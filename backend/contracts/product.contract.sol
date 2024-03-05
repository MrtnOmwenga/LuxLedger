// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Contract for managing the record supply chain
contract LedgerContract is ERC721, Ownable {
  // Variable to track the next available record ID
  uint256 private nextRecordId;

  // Enum to represent record status
  enum Status { InProduction, UnderInspection, Verified, InTransit, Sold, Returned, Lost, Stolen, Disposed }

  // Enum to represent inspection status
  enum InspectionStatus {Pending, Approved, Rejected}

  // Enum to represent owner types
  enum OwnerType {Manufacturer, Distributor, Retailer, IndependEntentity}

  // Struct to represent Quality Inspection.
  struct Inspection {
    address inspector;
    InspectionStatus status;
    string inspectionDate;
  }

  // Struct to represent ownership history
  struct Ownership {
    address owner;
    OwnerType ownerType;
    string purchaseDate;
  }

  // Struct to represent a record
  struct Record {
    uint256 recordId;
    string manufacturingDate;
    string[] componentIds;
    address manufacturer;
    Inspection[] inspections;
    Ownership[] ownershipHistory;
    Status status;
    string metadataCID; // IPFS CID for metadata
  }

  // Mapping to store record by recordId
  mapping(uint256 => Record) public Ledger;

  // Modifier to restrict access to certain functions
  modifier onlyRecordOwner(uint256 _recordId) {
    require(msg.sender == ownerOf(_recordId), "Only the owner can call this function");
    _;
  }

  // Event emitted when a new record batch is created
  event RecordCreated(uint256 indexed recordId, address indexed manufacturer);

  // Event emitted when an inspection is updated
  event InspectionUpdated(uint256 indexed recordId, uint256 indexed inspectionIndex, address indexed inspector, InspectionStatus status);

  // Event emitted when an ownership is changed
  event OwnershipChanged(uint256 indexed recordId, address indexed prev_owner, address curr_owner);

  constructor(address initialOwner) Ownable(initialOwner) ERC721("RecordNFT", "RNFT") {}

  // Function to create a new record batch
  function createRecord(
    string memory _manufacturingDate,
    string[] memory _componentIds,
    string memory _metadataCID // IPFS CID for metadata
  ) public returns (uint256) {
    uint256 _recordId = nextRecordId;
    nextRecordId++;

    // Create a new record batch
    Record storage newRecord = Ledger[_recordId];
    newRecord.recordId = _recordId;
    newRecord.manufacturingDate = _manufacturingDate;
    newRecord.componentIds = _componentIds;
    newRecord.manufacturer = msg.sender;
    newRecord.status = Status.InProduction;
    newRecord.metadataCID = _metadataCID;

    // Declare a local variable for the Ownership struct
    Ownership memory initialOwner = Ownership({
      owner: msg.sender,
      ownerType: OwnerType.Manufacturer,
      purchaseDate: _manufacturingDate
    });

    // Initialize the ownership history array and add the initial entry
    newRecord.ownershipHistory.push(initialOwner);

    // Mint a new NFT representing the record
    _mint(msg.sender, _recordId);

    _transfer(ownerOf(_recordId), msg.sender, _recordId);

    // Emit event
    emit RecordCreated(_recordId, msg.sender);
    return _recordId;
  }

  // Function to update the status of a record batch
  function updateRecordStatus(uint256 _recordId, Status _status) public onlyRecordOwner(_recordId) {
    require(Ledger[_recordId].manufacturer != address(0), "Batch does not exist");
    Ledger[_recordId].status = _status;
  }

  // Function to set inspection status of a record to pending
  function addInspector(uint256 _recordId, address _inspector, string memory _inspectionDate) public onlyRecordOwner(_recordId) {
    Record storage record = Ledger[_recordId];
    uint256 _inspectionIndex = record.inspections.length;
    if (_inspector != address(0)) {
      record.inspections.push(Inspection(_inspector, InspectionStatus.Pending, _inspectionDate));
    }
    emit InspectionUpdated(_recordId, _inspectionIndex, _inspector, InspectionStatus.Pending);
  }

  // Function to get the current inspection status of a record
  function getInspectionStatus(uint256 _recordId) public view returns (uint256, Inspection[] memory) {
    Record storage record = Ledger[_recordId];
    return (record.inspections.length, record.inspections);
  }

  // Function to update the inspection status of a record
  function updateInspection(uint256 _recordId, InspectionStatus _status, string memory _inspectionDate) public {
    Record storage record = Ledger[_recordId];
    uint256 _inspectionIndex = 0;
    for (uint256 i = 0; i < record.inspections.length; i++) {
      if (record.inspections[i].inspector == msg.sender) {
        _inspectionIndex = i;
        break;
      }
    }
    require(_inspectionIndex < record.inspections.length, "Inspection not found");
    require(record.inspections[_inspectionIndex].inspector == msg.sender, "Only the assigned inspector can update inspection status");
    record.inspections[_inspectionIndex].status = _status;
    record.inspections[_inspectionIndex].inspectionDate = _inspectionDate;
    emit InspectionUpdated(_recordId, _inspectionIndex, msg.sender, _status);
  }

  // Function to get ownership history
  function getOwnershipHistory(uint256 _recordId) public view returns (uint256, Ownership[] memory) {
    Record storage record = Ledger[_recordId];
    return (record.ownershipHistory.length, record.ownershipHistory);
  }

  // Function to transfer ownership of a record NFT
  function transferRecordOwnership(uint256 _recordId, address _to, OwnerType _ownerType, string memory _purchaseDate) public onlyRecordOwner(_recordId) {
    Record storage record = Ledger[_recordId];
    address prevOwner = record.ownershipHistory[record.ownershipHistory.length - 1].owner; // Get the previous owner

    // Add new ownership entry to history
    record.ownershipHistory.push(Ownership(_to, _ownerType, _purchaseDate));

    // Transfer ownership
    _transfer(msg.sender, _to, _recordId);

    emit OwnershipChanged(_recordId, prevOwner, _to);
  }
}
