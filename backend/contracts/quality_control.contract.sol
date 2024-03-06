// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QualityControl {
  struct Defect {
    uint256 defectId;
    uint256 productId;
    address inspector;
    string description;
  }

  mapping(uint256 => Defect) public defects;
  uint256 private nextDefectId;

  event DefectFound(uint256 defectId, uint256 productId, address inspector, string description);

  function reportDefect(uint256 _productId, string memory _description) external {
    uint256 defectId = nextDefectId++;
    defects[defectId] = Defect(defectId, _productId, msg.sender, _description);
    emit DefectFound(defectId, _productId, msg.sender, _description);
  }
}
