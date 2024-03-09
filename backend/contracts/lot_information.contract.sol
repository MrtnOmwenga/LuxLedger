// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LotInformation is ERC721 {
  uint256 private nextLotId;

  // Struct to represent lots
  struct Lot {
    uint256 batchId;
    uint256 lotSize;
  }

  // Struct to represent created lots
  struct createdLot {
    uint256 batchId;
    uint256 batchSize;
    uint256 existingLots;
  }

  // Mapping to store lot by lotId
  mapping(uint256 => Lot) public ProductLots;

  // Mapping to track created lots
  mapping(uint256 => createdLot) public CreatedLots;

  // Event emitted when a new lot is created
  event LotCreated(uint256 indexed lotId, uint256 indexed batchId);

  // Event emitted when an ownership is changed
  event LotOwnershipChanged(uint256 indexed ProductId, address indexed prev_owner, address curr_owner);

  constructor() ERC721("LotInformationContract", "LIC") {}

  // Register new batch
  function registerBatch(uint256 _batchId, uint256 _batchSize) external {
    CreatedLots[_batchId] = createdLot(_batchId, _batchSize, 0);
  }

  // Function to create a lot and establish ownership.
  function createLot(uint256 _batchId, uint256 _lotSize, address _owner) external returns(uint256) {
    uint256 _lotId = nextLotId;
    nextLotId++;

    require(CreatedLots[_batchId].batchSize > CreatedLots[_batchId].existingLots + _lotSize);
    CreatedLots[_batchId].existingLots += _lotSize;

    // Create record of lot
    ProductLots[_lotId] = Lot(_batchId, _lotSize);

    _safeMint(_owner, _lotId);
  
    emit LotCreated(_lotId, _batchId);
    return _lotId;
  }

  // Function get batch size
  function getLotSize(uint256 _lotId) external returns(uint256) {
    require(ProductLots[_lotId].lotSize != 0, "Product does not exist");

    return (ProductLots[_lotId].lotSize);
  }
}