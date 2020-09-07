pragma solidity ^0.7.0;
// SPDX-License-Identifier: MIT

import '../SafeMath.sol';
import '../IERC20.sol';
import './ModuleRegistry.sol';

interface IBankContract {
    function addToGuild(ModuleRegistry dao, address tokenAddress, uint256 amount) external;
    function addToEscrow(ModuleRegistry dao, address tokenAddress, uint256 amount) external;
    function balanceOf(ModuleRegistry dao, address tokenAddress, address account) external returns (uint256);
    function isReservedAddress(address applicant) external returns (bool);
    function transferFromGuild(ModuleRegistry dao, address payable applicant, address tokenAddress, uint256 amount) external;
}

contract BankContract is IBankContract {
    using SafeMath for uint256;

    modifier onlyModule(ModuleRegistry dao) {
        require(dao.isModule(msg.sender), "only registered modules can call this function");
        _;
    }

    event TokensCollected(address indexed moloch, address indexed token, uint256 amountToCollect);
    event Transfer(address indexed toAddress, address token, uint256 amount);

    address public constant GUILD = address(0xdead);
    address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);

    mapping (address => mapping(address => mapping(address => uint256))) public tokenBalances; // tokenBalances[molochAddress][userAddress][tokenAddress]

    function addToEscrow(ModuleRegistry dao, address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), ESCROW, tokenAddress, amount);
    }

    function addToGuild(ModuleRegistry dao, address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), GUILD, tokenAddress, amount);
    }
    
    function balanceOf(ModuleRegistry dao, address user, address token) override external view returns (uint256) {
        return tokenBalances[address(dao)][user][token];
    }

    function transferFromGuild(ModuleRegistry dao, address payable applicant, address token, uint256 amount) override external onlyModule(dao) {
        require(tokenBalances[address(dao)][GUILD][token] >= amount, "insufficient balance");
        unsafeSubtractFromBalance(address(dao), GUILD, token, amount);
        applicant.transfer(amount);
        //TODO transfer or make it available to withdraw by applicant?
        emit Transfer(applicant, token, amount);
    }

        function isReservedAddress(address applicant) override pure external returns (bool) {
        return applicant != GUILD && applicant != ESCROW && applicant != TOTAL;
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