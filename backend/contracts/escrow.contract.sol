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

  struct Listing {
    address seller;
    uint256 batchId;
    uint256 lotId;
    bool isFullBatch;
    uint256 pricePerUnit;
    bool isFulfilled;
  }

  mapping(uint256 => Listing) public listings;

  event ListingCreated(uint256 listingId, address seller, uint256 batchId, uint256 lotId, uint256 pricePerUnit);
  event PurchaseConfirmed(uint256 listingId, address buyer);

  receive() external payable {}

  modifier onlyBatchOwner(uint256 _batchId) {
    require(IProductInformation(productInformationContract).ownerOf(_batchId) == msg.sender, "You are not the owner of this product batch");
    _;
  }

  constructor(address _productInformationContract, address _lotInformationContract) {
    productInformationContract = _productInformationContract;
    lotInformationContract = _lotInformationContract;
  }

  function createListing(uint256 _batchId, uint256 _lotId, uint256 _pricePerUnit, bool _isFullBatch) public onlyBatchOwner(_batchId) returns(uint256) {
    require(_pricePerUnit > 0, "Price per unit must be greater than zero");

    uint256 _listingId = nextListingId++;
    listings[_listingId] = Listing(msg.sender, _batchId, _lotId, _isFullBatch, _pricePerUnit, false);

    if (_isFullBatch) {
      address _owner = IProductInformation(productInformationContract).ownerOf(_batchId);
      IProductInformation(productInformationContract).transferFrom(_owner, address(this), _lotId);
    } else {
      require(ILotInformation(lotInformationContract).ownerOf(_lotId) == msg.sender, "You are not the owner of this product batch");
      address _owner = ILotInformation(lotInformationContract).ownerOf(_lotId);
      ILotInformation(lotInformationContract).transferFrom(_owner, address(this), _lotId);
    }

    emit ListingCreated(_listingId, msg.sender, _batchId, _lotId, _pricePerUnit);

    return _listingId;
  }

  function purchase(uint256 _listingId) public payable {
    Listing storage listing = listings[_listingId];
    require(!listing.isFulfilled, "Listing is already fulfilled");

    if (listing.isFullBatch) {
      uint256 _batchSize = IProductInformation(productInformationContract).getBatchSize(listing.batchId);
      require(msg.value >= _batchSize * listing.pricePerUnit, "Insufficient payment");

      IProductInformation(productInformationContract).transferFrom(address(this), msg.sender, listing.batchId);
    } else {
      uint256 _lotSize = ILotInformation(lotInformationContract).getLotSize(listing.lotId);
      require(msg.value >= _lotSize * listing.pricePerUnit, "Insufficient payment");

      ILotInformation(lotInformationContract).transferFrom(address(this), msg.sender, listing.lotId);
    }

    payable(listing.seller).transfer(msg.value);
    listing.isFulfilled = true;

    emit PurchaseConfirmed(_listingId, msg.sender);
  }
}
