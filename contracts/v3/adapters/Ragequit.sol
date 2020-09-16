pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IFinancing.sol';
import '../core/Module.sol';
import '../core/Registry.sol';
import '../core/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IBank.sol';
import '../core/interfaces/IMember.sol';
import '../guards/AdapterGuard.sol';
import '../guards/ReentrancyGuard.sol';
import '../utils/SafeMath.sol';

contract RagequitContract is Module, AdapterGuard, ReentrancyGuard {
    using SafeMath for uint256;

    event Ragequit(address indexed member, uint256 burnedShares);

    Registry dao;

    constructor (address _dao) {
        dao = Registry(_dao);
    }

    /* 
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert();
    }

    function ragequit(uint256 sharesToBurn) public nonReentrant onlyMembers(dao) {
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));

        // FIXME: we still don't track the index to block the ragequit if member voted YES on a non-processed proposal 
        // require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");
        require(memberContract.hasEnoughShares(dao, msg.sender, sharesToBurn), "insufficient shares");
        IBank bank = IBank(dao.getAddress(BANK_MODULE));
        bank.burnShares(msg.sender, sharesToBurn);

        emit Ragequit(msg.sender, sharesToBurn);
    }

    // can only ragequit if the latest proposal you voted YES on has been processed
    // function canRagequit(uint256 highestIndexYesVote) public view returns (bool) {
    //     require(highestIndexYesVote < proposalQueue.length, "proposal does not exist");
    //     return proposals[proposalQueue[highestIndexYesVote]].flags[1];
    // }

}