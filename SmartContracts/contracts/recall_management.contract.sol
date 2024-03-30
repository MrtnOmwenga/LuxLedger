// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RecallManagement {
  struct Recall {
    uint256 recallId;
    uint256 batchId;
    address manufacturer;
    string reason;
    bool resolved;
  }

  mapping(uint256 => Recall) public recalls;
  uint256 private nextRecallId;

  event ProductRecalled(uint256 batchId, address manufacturer, string reason);

  function recallProduct(uint256 _batchId, string memory _reason) public {
    uint256 recallId = nextRecallId++;
    recalls[recallId] = Recall(recallId, _batchId, msg.sender, _reason, false);
  }

  function resolveRecall(uint256 _recallId) public {
    require(recalls[_recallId].manufacturer == msg.sender, "Only manufacturer can resolve recall");
    recalls[_recallId].resolved = true;
  }
}
