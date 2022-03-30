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

    // User requests a coupon/promissorynote 
    // User retrieve value of NFT from database (wmgi api)
    // User agrees on loan amount based on value of NFT 
    // User  deposits NFT into guildbank via a startPromissoryNoteAdapter
    // User receives coupon for 50% of NFT value.
    // User has 24 hours to redeem coupon
    // User redeems coupon and receives USDC
    //     - checks if NFT is deposited
    // User either return USDC + interest  OR has loan foreclosed. 

contract PromissoryNoteContract is Reimbursable, AdapterGuard, Signatures {

    
    //using Address for address payable;
    using SafeERC20 for IERC20;

  // event LoanCreated(DaoRegistry dao, address Borrower, uint256 amount, uint32 basisPoints, uint256 loanDuration);

    /**
    
        @param borrower the address taking out the loan
        @param principalLoanAmount the amount of erc20 borrowed 
        @param loanRepaymentAmount - the amount of erc20 to be repaid
        @param basisPoints - interest rate on principalLoanAmount
        @param loanAvailExpiration - loan is no longer availabe after this time
        @param loanDuration - length of loan 
        @param loanStartTime - the borrower initiates loan at this time
        @param nftCollateralContract - the nft address of the collateral
        @param nftIdNumber - the ID number of the NFT from nftCollateralContract
        @param nonce - tracking 
    */

    struct PromissoryNote {
        address erc20ToBorrow;
        address borrower;
        uint256 principalLoanAmount;
        uint256 loanRepaymentAmount; //for now, just one repayment amount. TODO make it timebased later.
        uint32 basisPoints; 
        uint64  loanAvailExpiration;
        uint256 loanDuration; 
        uint64 loanStartTime;
        address nftCollateralContract;
        uint256 nftIdNumber;
        uint256 nonce;
        //uint64 loadId; track with mapping?
    }
    
    string public constant COUPON_MESSAGE_TYPE = "Message(address borrower, uint256 principalLoanAmount)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
    keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig = keccak256("promissory-note.signerAddress");
    bytes32 constant AddressOfBorrower = keccak256("promissory-note.token.address");
    bytes32 constant ERC20TokenAddr = keccak256("promissory-note.erc20ToBorrow");
    //map DAO -> loanId ->amount

    // event LoanRepaid(); 

    // event LoanForeclosed();

    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        address erc20ToBorrow 
        ) external onlyAdapter(dao) {
            dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
            dao.setAddressConfiguration(ERC20TokenAddr, erc20ToBorrow);

            BankExtension bank = BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
            //check if erc20ToBorrower is a dao registered external token
            bank.isTokenAllowed(erc20ToBorrow); 

        }
        
      
    
    /**
     * @notice Hashes the provided PrommisoryNote coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param promissory d
     */
    function hashPromissoryNoteMessage(DaoRegistry dao, PromissoryNote memory promissory ) 
    public view returns (bytes32) 
    {
        bytes32 message = keccak256(
            abi.encode (
                COUPON_MESSAGE_TYPEHASH,
                promissory.erc20ToBorrow,
                promissory.borrower,
                promissory.principalLoanAmount,
                promissory.loanRepaymentAmount,
                promissory.basisPoints,
                promissory.loanAvailExpiration,
                promissory.loanDuration, 
                promissory.loanStartTime,
                promissory.nftCollateralContract,
                promissory.nftIdNumber,
                promissory.nonce
                
            )
        );
        return hashMessage(dao, address(this), message);
    }
        
    /**  
     * @notice redeems a prommisory note for funds from guildbank
     * @param dao s
     */
    function redeemPromissoryNote(
            DaoRegistry dao,
            address erc20ToBorrow, 
            address borrower,
            uint256 principalLoanAmount,
            uint256 loanRepaymentAmount, //for now, just one repayment amount. TODO make it timebased later.
            uint32 basisPoints, 
            uint64  loanAvailExpiration,
            uint256 loanDuration, 
            uint64 loanStartTime,
            address nftCollateralContract,
            uint256 nftIdNumber,
            uint256 nonce,
            bytes memory signature
        ) external reimbursable(dao)
    {
        //check if promissorynote already redeemend
        {
            uint256 currentFlag = _flags[address(dao)][nonce / 256];
            _flags[address(dao)][nonce / 256] = DaoHelper.setFlag(
                currentFlag,
                nonce % 256,
                true
            );
            require(
                DaoHelper.getFlag(currentFlag, nonce % 256) == false,
                "coupon already redeemed"
            );
        }
        //approvedPrincipalLoanAmount - 50% of price from WGMI
        PromissoryNote memory promissorynote = PromissoryNote(
            erc20ToBorrow,
            borrower,
            principalLoanAmount,
            loanRepaymentAmount, 
            basisPoints,
            loanAvailExpiration,
            loanDuration,
            loanStartTime,
            nftCollateralContract,
            nftIdNumber,
            nonce
        );

        bytes32 hash = hashPromissoryNoteMessage(dao, promissorynote);

        require(
            SignatureChecker.isValidSignatureNow(
                dao.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );

        IERC20 erc20 = IERC20(
            dao.getAddressConfiguration(ERC20TokenAddr)
        );

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        //check if NFT is in GUILD BANK
        //check if enough funds in GUILD BANK
        //start loan clock
        promissorynote.loanStartTime = now; 
        //withdraw
        bank.withdraw(
            dao,
            borrower,
            erc20ToBorrow
        );

    }

 
    
}