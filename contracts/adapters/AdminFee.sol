pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT
import "./interfaces/IAdminFee.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../utils/SafeMath.sol";
import "../guards/AdapterGuard.sol";
import "../utils/SafeMath.sol";

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

contract AdminFee is IAdminFee, AdapterGuard, DaoRegistry {
    using SafeMath for uint256;

    /*
    Default Values:

    if adminFeeDenominator = 200, then 0.5% (1/200) of total tokens allowed to be withdrawn every paymentPeriod. 

    */
    uint256 constant paymentPeriod = 90 days;
    uint256 public lastPaymentTime; //this will set as 'now'/'block.timestamp' in construtor
    address public laoFundAddress; //This field MUST be set in constructor
    uint256 public adminFeeDenominator = 200; //default denominator

    function configureAdmin(
        DaoRegistry dao,
        address _laoFundAddress,
        uint256 _adminFeeDenominator //200 = 0.5% (1/200)
    ) external onlyAdapter(dao) {
        require(_laoFundAddress != address(0), "laoFundAddress cannot be 0");
        // require(uint256 _adminFeeDenominator >= 200); - keep this?
        laoFundAddress = _laoFundAddress;
        adminFeeDenominator = _adminFeeDenominator;
        lastPaymentTime = block.timestamp; //now
    }

    function withdrawAdminFee(DaoRegistry dao) public override {
        require(
            block.timestamp >= lastPaymentTime.add(paymentPeriod),
            "90 days have not passed since last withdrawal"
        );
        lastPaymentTime = lastPaymentTime.add(paymentPeriod); // set it to the next payment period
        //local variables to save gas by reading from storage only 1x
        uint256 denominator = adminFeeDenominator;
        address recipient = laoFundAddress;

        uint256 tokenLength = dao.nbTokens();

        for (uint256 i = 0; i < tokenLength; i++) {
            address token = dao.getToken(i);

            uint256 amount = dao.balanceOf(GUILD, token) / denominator;
            if (amount > 0) {
                //otherwise skip for efficiency
                dao.addToBalance(GUILD, token, amount);
                dao.subtractFromBalance(recipient, token, amount);
            }
        }
    }
    // Remove Event emit WithdrawAdminFee(laoFundAddress,token, amount);
}
