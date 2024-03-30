// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QualityControl {
  struct Defect {
    uint256 defectId;
    uint256 batchId;
    address inspector;
    string descriptionCID;
  }

  mapping(uint256 => Defect) public defects;
  uint256 private nextDefectId;

  event DefectFound(uint256 _defectId, uint256 _batchId, address _inspector, string _descriptionCID);

  function reportDefect(uint256 _batchId, string memory _descriptionCID) external {
    uint256 _defectId = nextDefectId++;
    defects[_defectId] = Defect(_defectId, _batchId, msg.sender, _descriptionCID);
    emit DefectFound(_defectId, _batchId, msg.sender, _descriptionCID);
  }
}
