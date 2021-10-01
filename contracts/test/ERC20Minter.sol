pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../extensions/executor/Executor.sol";
import "../helpers/DaoHelper.sol";
import "../guards/AdapterGuard.sol";
import "../adapters/interfaces/IConfiguration.sol";
import "./ProxToken.sol";
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

contract ERC20MinterContract is AdapterGuard {
    using Address for address payable;

    event Minted(address owner, address token, uint256 amount);

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    function execute(
        DaoRegistry dao,
        address token,
        uint256 amount
    ) external reentrancyGuard(dao) {
        address proxyAddr = dao.getExtensionAddress(DaoHelper.EXECUTOR_EXT);
        ERC20MinterContract executor = ERC20MinterContract(payable(proxyAddr));
        executor.mint(dao, token, amount);
    }

    function mint(
        DaoRegistry dao,
        address token,
        uint256 amount
    ) external executorFunc(dao) {
        address sender = msg.sender;
        ProxTokenContract erc20Token = ProxTokenContract(token);
        erc20Token.mint(amount);
        emit Minted(sender, token, amount);
    }
}
