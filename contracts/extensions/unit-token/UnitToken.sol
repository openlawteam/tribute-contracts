pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

// import "../core/DaoConstants.sol";
// import "../core/DaoRegistry.sol";
// import "../extensions/bank/Bank.sol";
// import "../guards/AdapterGuard.sol";
// import "./interfaces/IConfiguration.sol";
// import "../adapters/interfaces/IVoting.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

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


/**
 * 
 The UnitTokenContract  is a contract to handle an erc20 token that 
 mirrors the number of Units/voting weight held by DAO members. 


  */
contract UnitTokenExtension {

	constructor() public {
	}

	function withdrawUnitToken(address payable member, uint256 amount) external returns(bool res)  {
    return false;
	}

	function _internalTransferUnitToken(address from, address to, uint256 amount) internal returns(bool res) {
    //require isMember 
    //require member balanceOf > 0 
    //update member votes by amount 
    //bank.internalTrnasfer  or erc20transferFrom if allowed
    return false;
	}
	

  //TESTS: 

  //Get Member voting weight, 1 vote = 1 token

  //track the token from Bank, bank.balaceOf()

  //Units of DAO should always match bank.balanceOf() 

  //Units should match after bank.addToBalance()

  //Units should match after bank.subtractFromBalance()

  //Units should match after bank.withdraw() 

  //Units should match bank.balanceOf() after internalTransfer()

  //is token pausable?

  // is token transferrable outside the DAO? can this be turned on and off?
}
