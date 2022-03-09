PromissoryNote.sol
pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "../utils/Signatures.sol";
import "../helpers/DaoHelper.sol";

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

contract PromissoryNoteContract is Reimbursable, AdapterGuard, Signatures {

    
    using Address for address payable;
    using SafeERC20 for IERC20;

    event LoanCreated(DaoRegistry dao, address Borrower, uint256 amount, uint32 basisPoints, uint256 loanDuration);

    struct PromissoryNote {
        address borrower;
        uint256 principalLoanAmount;
        uint256 loanRepaymentAmount; //for now, just one repayment amount. TODO make it timebased later.
        uint32 basisPoints; 
        uint256 loanDuration; 
        uint64 loanStartTime;
        address nftCollateralContract;
        //uint64 loadId;
    }
    //
    string public constant COUPON_MESSAGE_TYPE = "Message(address borrower, uint256 principalLoanAmount)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
    keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig = keccak256("promissory-note.signerAddress");

    //encode parameters
    //bytes32 constant ..

    //map DAO -> loanId ->amount

    // event LoanRepaid(); 

    // event LoanForeclosed();

    function configureDAO(DaoRegistry dao){

    }
    
    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashPromissoryNoteMessage(DaoRegistry dao) {

    }
    
    /**  
     * @notice redeems a prommisory note for funds from guildbank
     * @param dao 
     */
    function redeemPromissoryNote(DaoRegistry dao){
        //approvedPrincipalLoanAmount - 50% of price from WGMI
        //is NFT deposited
        // enough funds in Guild
        // does the loan start an origination time or upon withdraw?
        //redeemNote - withdraw funds
    }

 
    // User requests a coupon/promissory note
    // User retrieve value of NFT from database (wmgi api)
    // User agrees on loan amount based on value of NFT 
    //User  deposits NFT into guildbank via a startPromissoryNoteAdapter
    // User receives coupon for 50% of NFT value.
    // User redeems coupon and receives USDC
    //     - checks if NFT is deposited
    // User either return USDC + interest  OR has loan foreclosed. 
}