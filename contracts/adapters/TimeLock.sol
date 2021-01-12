pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeCast.sol";
import "../utils/IERC20.sol";

/**
MIT License
Copyright (c) 2020 Openlaw
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract TimeLockContract is DaoConstants, MemberGuard {
    using SafeCast for uint256;
    uint256 public timeLockCount;
    
    mapping(uint256 => TimeLock) public timeLockRegistrations;

    enum ConfigurationStatus {NOT_CREATED, IN_PROGRESS, DONE}
    
    struct TimeLock {  
        address account;
        address token;
        uint256 amount;
        uint256 termination;
    }

    /**
     * @dev default fallback function to receive ether sent to the contract
     */
    receive() external payable {}
    
    /**
     * @dev function to allow dao account to timelock their balance
     * @param dao Dao address to withdraw balance 
     * @param account Account address with dao balance to withdraw
     * @param token Token or ETH to withdraw from dao
     * @param amount Amount of token or ETH
     * @param termination Unix epoch time for lock termination
     */
    function withdrawToTimeLock(
        DaoRegistry dao,
        address account, 
        address token,
        uint256 amount,
        uint256 termination
    ) external returns (uint256) {
        require(
            dao.isNotReservedAddress(msg.sender),
            "withdraw::reserved address"
        );
        require(dao.balanceOf(account, token) > 0, "nothing to withdraw");
        dao.withdraw(address(this), token, amount);
        
        uint256 registration = timeLockCount++;
        
        timeLockRegistrations[registration] = TimeLock(account, token, amount, termination);
        
        return registration;
    }
    
    /*
     * @dev function to allow dao account to withdraw their timelock balance
     * @param registration Number assigned to lock registration
     */
    function withdrawFromTimelock(uint256 registration) external {
        TimeLock storage lock = timeLockRegistrations[registration];
        
        require(msg.sender == lock.account, "not registered account");
        require(block.timestamp >= lock.termination, "not yet terminated");
        
        IERC20 erc20 = IERC20(lock.token);
        erc20.transfer(msg.sender, lock.amount);
    }
}
