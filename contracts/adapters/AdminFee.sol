pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../utils/SafeMath.sol";
import "../guards/DaoGuard.sol";
//Ownable + Context for Admin Fee functions
import "../guards/AdminGuard.sol";

/**
MIT License
**/

/*MIT License

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
SOFTWARE.*/

contract adminFee is DaoRegistry, Ownable {
    using SafeMath for uint256;
     //DaoRegistry public dao;
    constructor(address _laoFundAddress)  {
        //dao = DaoRegistry(_dao);
        require(_laoFundAddress != address(0), "laoFundAddress cannot be 0");
        laoFundAddress = _laoFundAddress; // LAO add on for adminFee
        lastPaymentTime = block.timestamp; // LAO add on for adminFee

    }

    //EVENTS - Remove Event
    //event WithdrawAdminFee(address indexed laoFundAddress, address token [], uint256 amount );

    uint256 constant paymentPeriod = 90 days;
    uint256 public lastPaymentTime; //this will set as 'now' in construtor = summoningTime;
    address public laoFundAddress; //This field MUST be set in constructor or set to default to summoner here.
    uint256 public adminFeeDenominator = 200; //initial denominator

    function setAdminFee(uint256 _adminFeeDenominator, address _laoFundAddress)
        public
        onlyOwner
    {
        require(_adminFeeDenominator >= 200); //max denominator
        adminFeeDenominator = _adminFeeDenominator;
        laoFundAddress = _laoFundAddress;
    }

    function withdrawAdminFee(DaoRegistry dao) public {

        require(
            block.timestamp >= lastPaymentTime.add(paymentPeriod),
            "90 days have not passed since last withdrawal"
        );
        lastPaymentTime = lastPaymentTime.add(paymentPeriod); // set it to the next payment period
        //local variables to save gas by reading from storage only 1x
        uint256 denominator = adminFeeDenominator;
        address recipient = laoFundAddress;

        //use MAX_TOKENS OR availableTokens?  
        for (uint256 i = 0; i < MAX_TOKENS; i++) {
            address [] memory token = dao.tokens();
            //??
            uint256  amount = dao.balanceOf(GUILD, token[i])/denominator;
            if (amount > 0) {
                //otherwise skip for efficiency
                dao.addToBalance(GUILD,token[i],amount);
                dao.subtractFromBalance(recipient,token[i],amount);
            }
        }
    }
    // Remove Event emit WithdrawAdminFee(laoFundAddress,token, amount);
}
