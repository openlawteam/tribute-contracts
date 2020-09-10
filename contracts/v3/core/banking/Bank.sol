pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../interfaces/IBank.sol';
import '../../utils/SafeMath.sol';
import '../../utils/IERC20.sol';
import '../../guards/ModuleGuard.sol';

contract BankContract is IBank, ModuleGuard {
    using SafeMath for uint256;

    event TokensCollected(address indexed moloch, address indexed token, uint256 amountToCollect);
    event Transfer(address indexed fromAddress, address indexed toAddress, address token, uint256 amount);

    address public constant GUILD = address(0xdead);
    address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);

    mapping (address => mapping(address => mapping(address => uint256))) public tokenBalances; // tokenBalances[molochAddress][userAddress][tokenAddress]

    function addToEscrow(Registry dao, address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), ESCROW, tokenAddress, amount);
    }

    function addToGuild(Registry dao, address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), GUILD, tokenAddress, amount);
    }
    
    function transferFromGuild(Registry dao, address applicant, address token, uint256 amount) override external onlyModule(dao) {
        require(tokenBalances[address(dao)][GUILD][token] >= amount, "insufficient balance");
        unsafeSubtractFromBalance(address(dao), GUILD, token, amount);
        unsafeAddToBalance(address(dao), applicant, token, amount);
        emit Transfer(GUILD, applicant, token, amount);
    }

    function balanceOf(Registry dao, address user, address token) override external view returns (uint256) {
        return tokenBalances[address(dao)][user][token];
    }

    function isReservedAddress(address applicant) override pure external returns (bool) {
        return applicant != address(0x0) && applicant != GUILD && applicant != ESCROW && applicant != TOTAL;
    }

    /**
    Internal bookkeeping
     */
    function unsafeAddToBalance(address moloch, address user, address token, uint256 amount) internal {
        tokenBalances[moloch][user][token] += amount;
        tokenBalances[moloch][TOTAL][token] += amount;
    }

    function unsafeSubtractFromBalance(address moloch, address user, address token, uint256 amount) internal {
        tokenBalances[moloch][user][token] -= amount;
        tokenBalances[moloch][TOTAL][token] -= amount;
    }

    function unsafeInternalTransfer(address from, address to, address moloch, address token, uint256 amount) internal {
        unsafeSubtractFromBalance(moloch, from, token, amount);
        unsafeAddToBalance(moloch, to, token, amount);
    }

    receive() external payable {

    }
}