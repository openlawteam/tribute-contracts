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
 The UnitTokenExtension  is a contract to handle an erc20 token that 
 mirrors the number of Units/voting weight held by DAO members. 


  */
contract UnitTokenExtension is DaoConstants, Bank, AdapterGuard {

  //unitToken is the token address of the erc20 aligned with the reserverd address UNITS.
  uint256 public unitToken; 
  //Dao address
  DaoRegistry public dao; 

  //create event? 
   
   //todo -- change to initalize() for proxy pattern
	constructor( DaoRegistry _dao, address _unitToken) public {
    require(_dao.isMember(creator), "bank::not member");
    unitToken = _unitToken; 
    dao = _dao;
	}

	function _internalTransferUnitToken(address from, address to, uint256 amount) public returns(bool res) {
    //require member receiving UnitToken to already be a member of the DAO 
    require (DaoRegistry.isMember(to) = true, "receipient is not a member of the dao");
    //balance of transferor must be > 0 UNITS
    require (Bank.balanceOf(from, UNITS) > 0, "member must have greater than 0 UNITS");
    //check UnitToken balance using Bank contract
    require (Bank.balanceOf(from, unitToken) > 0, "member does not have any Unit Tokens to transfer");
    //update member UNITS by amount 
    Bank.internalTransfer(from, to, UNITS, amount);

    //use the Bank's internalTransfer() for unitToken OR
    //IERC20.transferFrom(from, to, unitToken, amount)? 
    Bank.internalTransfer(from, to, unitToken, amount);
    //create an emit event?
    return true;
	} 
} 
