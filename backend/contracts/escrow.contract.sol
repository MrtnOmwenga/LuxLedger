// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IProductInformation {
  function ownerOf(uint256 tokenId) external view returns (address owner);
  function transferFrom(address _from, address _to, uint256 _id) external;
  function getBatchSize(uint256 _batchId) external returns(uint256);
}

interface ILotInformation {
  function ownerOf(uint256 tokenId) external view returns (address owner);
  function transferFrom(address _from, address _to, uint256 _id) external;
  function getLotSize(uint256 _lotId) external returns(uint256);
}

contract Escrow {
  uint256 public nextListingId;

  address productInformationContract;
  address lotInformationContract;

  enum ReturnStatus{Pending, Approved, Denied}

  struct Lot {
    address seller;
    uint256 batchId;
    uint256 lotId;
    uint256 pricePerUnit;
    bool isFulfilled;
  }
  struct Batch {
    address seller;
    uint256 batchId;
    uint256 pricePerUnit;
    bool isFulfilled;
  }
  struct ReturnRequests {
    uint256 listingId;
    address buyer;
    ReturnStatus status;
  }

  mapping(uint256 => Lot) public LotListings;
  mapping(uint256 => Batch) public BatchListings;
  mapping(uint256 => ReturnRequests) public Returns;

  event LotListingCreated(uint256 listingId, address seller, uint256 batchId, uint256 lotId, uint256 pricePerUnit);
  event BatchListingCreated(uint256 listingId, address seller, uint256 batchId, uint256 pricePerUnit);
  event PurchaseConfirmed(uint256 listingId, address buyer);
  event ProductReturned(uint256 listingId, address buyer, address seller);
  event ReturnApproved(uint256 listingId, address buyer, address seller);

  receive() external payable {}

  modifier onlyLotOwner(uint256 _lotId) {
    require(ILotInformation(lotInformationContract).ownerOf(_lotId) == msg.sender, "You are not the owner of this product batch");
    _;
  }

  modifier onlyBatchOwner(uint256 _batchId) {
    require(IProductInformation(productInformationContract).ownerOf(_batchId) == msg.sender, "You are not the owner of this product batch");
    _;
  }

  constructor(address _productInformationContract, address _lotInformationContract) {
    productInformationContract = _productInformationContract;
    lotInformationContract = _lotInformationContract;
  }

  function createLotListing(uint256 _batchId, uint256 _lotId, uint256 _pricePerUnit) public onlyLotOwner(_batchId) returns(uint256) {
    require(_pricePerUnit > 0, "Price per unit must be greater than zero");

    uint256 _listingId = nextListingId++;
    LotListings[_listingId] = Lot(msg.sender, _batchId, _lotId, _pricePerUnit, false);

    address _owner = ILotInformation(lotInformationContract).ownerOf(_lotId);
    ILotInformation(lotInformationContract).transferFrom(_owner, address(this), _lotId);

    emit LotListingCreated(_listingId, msg.sender, _batchId, _lotId, _pricePerUnit);

    return _listingId;
  }

  function createBatchListing(uint256 _batchId, uint256 _pricePerUnit) public onlyBatchOwner(_batchId) returns(uint256) {
    require(_pricePerUnit > 0, "Price per unit must be greater than zero");

    uint256 _listingId = nextListingId++;
    BatchListings[_listingId] = Batch(msg.sender, _batchId, _pricePerUnit, false);

    address _owner = IProductInformation(productInformationContract).ownerOf(_batchId);
    IProductInformation(productInformationContract).transferFrom(_owner, address(this), _batchId);

    emit BatchListingCreated(_listingId, msg.sender, _batchId, _pricePerUnit);

    return _listingId;
  }

  function purchaseLot(uint256 _listingId) public payable {
    require(LotListings[_listingId].seller != address(0), "Product does not exist");
  
    Lot storage listing = LotListings[_listingId];
    require(!listing.isFulfilled, "Listing is already fulfilled");

    uint256 _lotSize = ILotInformation(lotInformationContract).getLotSize(listing.lotId);
    require(msg.value >= _lotSize * listing.pricePerUnit, "Insufficient payment");

    ILotInformation(lotInformationContract).transferFrom(address(this), msg.sender, listing.lotId);
    payable(listing.seller).transfer(msg.value);

    listing.isFulfilled = true;

    emit PurchaseConfirmed(_listingId, msg.sender);
  }

  function purchaseBatch(uint256 _listingId) public payable {
    require(BatchListings[_listingId].seller != address(0), "Product does not exist");

    Batch storage listing = BatchListings[_listingId];
    require(!listing.isFulfilled, "Listing is already fulfilled");

    uint256 _batchSize = IProductInformation(productInformationContract).getBatchSize(listing.batchId);
    require(msg.value >= _batchSize * listing.pricePerUnit, "Insufficient payment");

    IProductInformation(productInformationContract).transferFrom(address(this), msg.sender, listing.batchId);
    payable(listing.seller).transfer(msg.value);

    listing.isFulfilled = true;

    emit PurchaseConfirmed(_listingId, msg.sender);
  }

  // Function to allow product owners to send back recalled products
  function returnLot(uint256 _listingId) public {
    require(LotListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");

    Lot storage listing = LotListings[_listingId];
    address _owner = ILotInformation(lotInformationContract).ownerOf(listing.lotId);
    require(_owner == msg.sender, "You are not the owner of this product batch");

    // Transfer ownership back to the escrow
    ILotInformation(lotInformationContract).transferFrom(msg.sender, address(this), listing.lotId);

    Returns[_listingId].status = ReturnStatus.Pending;

    emit ProductReturned(_listingId, msg.sender, LotListings[_listingId].seller);
  }

  // Function to allow product owners to send back recalled products
  function returnBatch(uint256 _listingId) public {
    require(BatchListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");

    Batch storage listing = BatchListings[_listingId];
    address _owner = IProductInformation(productInformationContract).ownerOf(listing.batchId);
    require(_owner == msg.sender, "You are not the owner of this product batch");

    // Transfer ownership back to the escrow
    IProductInformation(productInformationContract).transferFrom(msg.sender, address(this), listing.batchId);

    Returns[_listingId].status = ReturnStatus.Pending;

    emit ProductReturned(_listingId, msg.sender, BatchListings[_listingId].seller);
  }

  function approveLotReturn(uint256 _listingId) public payable {
    require(LotListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");
    require(msg.sender == LotListings[_listingId].seller, "Only seller can handle requests");

    Lot storage listing = LotListings[_listingId];
    ILotInformation(lotInformationContract).transferFrom(address(this), msg.sender, listing.lotId);
    payable(Returns[_listingId].buyer).transfer(msg.value);

    Returns[_listingId].status = ReturnStatus.Approved;

    emit ReturnApproved(_listingId, Returns[_listingId].buyer, msg.sender);
  }

  function approveBatchtReturn(uint256 _listingId) public payable {
    require(BatchListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");
    require(msg.sender == BatchListings[_listingId].seller, "Only seller can handle requests");

    Batch storage listing = BatchListings[_listingId];
    IProductInformation(productInformationContract).transferFrom(address(this), msg.sender, listing.batchId);
    payable(Returns[_listingId].buyer).transfer(msg.value);

    Returns[_listingId].status = ReturnStatus.Approved;

    emit ReturnApproved(_listingId, Returns[_listingId].buyer, msg.sender);
  }

  function denyLotReturn(uint256 _listingId) public payable {
    require(LotListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");
    require(msg.sender == LotListings[_listingId].seller, "Only seller can handle requests");

    Lot storage listing = LotListings[_listingId];
    ILotInformation(lotInformationContract).transferFrom(address(this), Returns[_listingId].buyer, listing.lotId);

    Returns[_listingId].status = ReturnStatus.Denied;

    emit ReturnApproved(_listingId, Returns[_listingId].buyer, msg.sender);
  }

  function denyBatchReturn(uint256 _listingId) public payable {
    require(BatchListings[_listingId].seller != address(0), "Product does not exist");
    require(Returns[_listingId].buyer == address(0), "Return request already exists");
    require(msg.sender == BatchListings[_listingId].seller, "Only seller can handle requests");

    Batch storage listing = BatchListings[_listingId];
    IProductInformation(productInformationContract).transferFrom(address(this), Returns[_listingId].buyer, listing.batchId);

    Returns[_listingId].status = ReturnStatus.Denied;

    emit ReturnApproved(_listingId, Returns[_listingId].buyer, msg.sender);
  }
}
