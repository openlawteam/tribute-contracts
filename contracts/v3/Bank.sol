pragma solidity ^0.7.0;
// SPDX-License-Identifier: MIT

import "../SafeMath.sol";
import "../IERC20.sol";

interface IBankContract {
    
}

contract BankContract {
    using SafeMath for uint256;

    event TokensCollected(address indexed moloch, address indexed token, uint256 amountToCollect);

    address public constant GUILD = address(0xdead);
    address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);

    mapping (address => mapping(address => mapping(address => uint256))) public tokenBalances; // tokenBalances[molochAddress][userAddress][tokenAddress]
    mapping(address => mapping(address => bool)) public tokenWhitelist; // tokenWhitelist[molochAddress][tokenAddress]

    function updateWhitelist(address moloch, address token, bool value) public {
        tokenWhitelist[moloch][token] = value;
    }

    function updateTokenBalance(address moloch, address token) external {
        uint256 amountToCollect = IERC20(token).balanceOf(address(this)).sub(tokenBalances[moloch][TOTAL][token]);
        // only collect if 1) there are tokens to collect 2) token is whitelisted 3) token has non-zero balance
        require(amountToCollect > 0, 'no tokens to collect');
        require(tokenWhitelist[moloch][token], 'token to collect must be whitelisted');
        require(tokenBalances[moloch][GUILD][token] > 0, 'token to collect must have non-zero guild bank balance');
        
        unsafeAddToBalance(moloch, GUILD, token, amountToCollect);
        emit TokensCollected(moloch, token, amountToCollect);
    }
    
    function getTokenBalance(address moloch, address user, address token) external view returns (uint256) {
        return tokenBalances[moloch][user][token];
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
}