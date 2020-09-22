pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../Module.sol';
import '../interfaces/IMember.sol';
import '../interfaces/IBank.sol';
import '../../utils/SafeMath.sol';
import '../../helpers/FlagHelper.sol';
import '../../guards/ModuleGuard.sol';
import '../../guards/ReentrancyGuard.sol';

contract MemberContract is IMember, Module, ModuleGuard, ReentrancyGuard {
    using FlagHelper for uint256;
    using SafeMath for uint256;

    event UpdateMember(address dao, address member, uint256 shares);
    event UpdateDelegateKey(address dao, address indexed memberAddress, address newDelegateKey);

    struct Member {
        uint256 flags;
        address delegateKey;
        uint256 nbShares;
    }

    /// @notice A checkpoint for marking number of votes from a given block
    struct Checkpoint {
        uint256 fromBlock;
        uint256 votes;
    }

    uint256 public totalShares = 1; // Maximum number of shares 2**256 - 1

    mapping(address => mapping(address => Member)) members;
    mapping(address => mapping(address => address)) memberAddresses;
    mapping(address => mapping(address => address)) memberAddressesByDelegatedKey;
    /// @notice A record of votes checkpoints for each account, by index
    mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;
    /// @notice The number of checkpoints for each account
    mapping (address => uint32) public numCheckpoints;

    function isActiveMember(Registry dao, address addr) override external view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[address(dao)][addr];
        uint256 memberFlags = members[address(dao)][memberAddr].flags;
        return memberFlags.exists() && !memberFlags.isJailed() && members[address(dao)][memberAddr].nbShares > 0;
    }

    function memberAddress(Registry dao, address memberOrDelegateKey) override external view returns (address) {
        return memberAddresses[address(dao)][memberOrDelegateKey];
    }

    function updateMember(Registry dao, address memberAddr, uint256 shares) override external onlyModule(dao) {
        Member storage member = members[address(dao)][memberAddr];
        if(member.delegateKey == address(0x0)) {
            member.flags = 1;
            member.delegateKey = memberAddr;
        }

        member.nbShares = shares;
        
        totalShares = totalShares.add(shares);
        
        memberAddressesByDelegatedKey[address(dao)][member.delegateKey] = memberAddr;

        emit UpdateMember(address(dao), memberAddr, shares);
    }

    function updateDelegateKey(Registry dao, address memberAddr, address newDelegateKey) override external onlyModule(dao) {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(memberAddresses[address(dao)][newDelegateKey] == address(0x0), "cannot overwrite existing members");
            require(memberAddresses[address(dao)][memberAddressesByDelegatedKey[address(dao)][newDelegateKey]] == address(0x0), "cannot overwrite existing delegate keys");
        }

        Member storage member = members[address(dao)][memberAddr];
        require(member.flags.exists(), "member does not exist");
        memberAddressesByDelegatedKey[address(dao)][member.delegateKey] = address(0x0);
        memberAddressesByDelegatedKey[address(dao)][newDelegateKey] = memberAddr;
        member.delegateKey = newDelegateKey;

        emit UpdateDelegateKey(address(dao), memberAddr, newDelegateKey);
    }

    function burnShares(Registry dao, address memberAddr, uint256 sharesToBurn) override external onlyModule(dao) {
        require(_enoughSharesToBurn(dao, memberAddr, sharesToBurn), "insufficient shares");
        
        Member storage member = members[address(dao)][memberAddr];
        member.nbShares = member.nbShares.sub(sharesToBurn);
        totalShares = totalShares.sub(sharesToBurn);

        emit UpdateMember(address(dao), memberAddr, member.nbShares);
    }

    /**
     * Public read-only functions 
     */
    function nbShares(Registry dao, address member) override external view returns (uint256) {
        return members[address(dao)][member].nbShares;
    }

    function getTotalShares() override external view returns(uint256) {
        return totalShares;
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) override external view returns (uint256) {
        uint32 nCheckpoints = numCheckpoints[account];
        return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint blockNumber) override external view returns (uint256) {
        require(blockNumber < block.number, "Uni::getPriorVotes: not yet determined");

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                uint256 srcRepNew = srcRepOld.sub(amount);
                _writeCheckpoint(srcRep, srcRepNum, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                uint256 dstRepNew = dstRepOld.add(amount);
                _writeCheckpoint(dstRep, dstRepNum, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(address delegatee, uint32 nCheckpoints, uint256 newVotes) internal {
      if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == block.number) {
          checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
      } else {
          checkpoints[delegatee][nCheckpoints] = Checkpoint(block.number, newVotes);
          numCheckpoints[delegatee] = nCheckpoints + 1;
      }
    }

    /**
     * Internal Utility Functions
     */

    function _enoughSharesToBurn(Registry dao, address memberAddr, uint256 sharesToBurn) internal view returns (bool) {
        return sharesToBurn > 0 && members[address(dao)][memberAddr].nbShares >= sharesToBurn;
    }

}