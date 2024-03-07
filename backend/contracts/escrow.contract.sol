// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./product_information.contract.sol";
import "hardhat/console.sol";

interface IProductBatchOwner {
  function productBatchOwner(uint256 _batchId) external view returns(address);
}

contract Escrow {
  uint256 public nextListingId;

  address productInformationContract;

  struct Listing {
    address seller;
    uint256 batchId;
    uint256 quantity;
    uint256 pricePerUnit;
    bool isFulfilled;
  }

  mapping(uint256 => Listing) public listings;

  event ListingCreated(uint256 listingId, address seller, uint256 batchId, uint256 quantity, uint256 pricePerUnit);
  event PurchaseConfirmed(uint256 listingId, address buyer);

  receive() external payable {}

  modifier onlyBatchOwner(uint256 _batchId) {
    require(IProductBatchOwner(productInformationContract).productBatchOwner(_batchId) == msg.sender, "You are not the owner of this product batch");
    _;
  }

  constructor(address _productInformationContract) {
    productInformationContract = _productInformationContract; // Initialize ProductInformation contract
  }

  function getBatchOwner(uint256 _batchId) external view returns(address) {
    return IProductBatchOwner(productInformationContract).productBatchOwner(_batchId);
  }

  function createListing(uint256 _batchId, uint256 _quantity, uint256 _pricePerUnit) public onlyBatchOwner(_batchId) returns(uint256) {
    require(_quantity > 0, "Quantity must be greater than zero");
    require(_pricePerUnit > 0, "Price per unit must be greater than zero");

    uint256 listingId = nextListingId++;
    listings[listingId] = Listing(msg.sender, _batchId, _quantity, _pricePerUnit, false);

    _transfer(ownerOf(_batchId), address(this), _batchId);
    emit ListingCreated(listingId, msg.sender, _batchId, _quantity, _pricePerUnit);

    return listingId;
  }

  function purchase(uint256 _listingId) public payable {
    Listing storage listing = listings[_listingId];
    require(!listing.isFulfilled, "Listing is already fulfilled");
    require(msg.value >= listing.pricePerUnit * listing.quantity, "Insufficient payment");

    payable(listing.seller).transfer(msg.value);
    listing.isFulfilled = true;

    emit PurchaseConfirmed(_listingId, msg.sender);
  }

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }
}
