pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../Module.sol';
import '../interfaces/IBank.sol';
import '../interfaces/IMember.sol';
import '../../utils/SafeMath.sol';
import '../../utils/IERC20.sol';
import '../../guards/ModuleGuard.sol';

contract BankContract is IBank, Module, ModuleGuard {
    using SafeMath for uint256;
    
    event TokensCollected(address indexed moloch, address indexed token, uint256 amountToCollect);
    event Transfer(address indexed fromAddress, address indexed toAddress, address token, uint256 amount);

    address public constant GUILD = address(0xdead);
    address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);
    uint256 public constant MAX_APPROVED_TOKENS = 100;

    Registry dao;
    address[] public approvedTokens;
    uint256 public chunkSize;
    uint256 public sharesPerChunk;

    mapping (address => mapping(address => mapping(address => uint256))) public tokenBalances; // tokenBalances[molochAddress][userAddress][tokenAddress]

    constructor(Registry _dao, uint256 _chunkSize, uint256 _nbShares, address[] memory _approvedTokens) {
        dao = _dao;
        require(_chunkSize > 0, "invalid _chunkSize");
        chunkSize = _chunkSize;
        
        require(_nbShares > 0, "invalid _nbShares");
        sharesPerChunk = _nbShares;
        
        require(_approvedTokens.length > 0 && _approvedTokens.length <= MAX_APPROVED_TOKENS, "invalid _approvedTokens");
        for (uint256 i = 0; i < _approvedTokens.length; i++) {
            require(_approvedTokens[i] != address(0x0), "_approvedToken cannot be 0");
            approvedTokens.push(_approvedTokens[i]);
        }
    }

    receive() external payable {

    }

    function addToEscrow(address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), ESCROW, tokenAddress, amount);
    }

    function addToGuild(address tokenAddress, uint256 amount) override external onlyModule(dao) {
        unsafeAddToBalance(address(dao), GUILD, tokenAddress, amount);
    }
    
    function transferFromGuild(address applicant, address token, uint256 amount) override external onlyModule(dao) {
        require(tokenBalances[address(dao)][GUILD][token] >= amount, "insufficient balance");
        unsafeSubtractFromBalance(address(dao), GUILD, token, amount);
        unsafeAddToBalance(address(dao), applicant, token, amount);
        emit Transfer(GUILD, applicant, token, amount);
    }

    function burnShares(address memberAddr, uint256 sharesToBurn) override external onlyModule(dao) {
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        uint256 totalShares = memberContract.getTotalShares();
        for (uint256 i = 0; i < approvedTokens.length; i++) {
            address token = approvedTokens[i];
            uint256 amountToRagequit = fairShare(tokenBalances[address(dao)][GUILD][token], sharesToBurn, totalShares);
            if (amountToRagequit > 0) { // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution (which would break ragekicks)
                // if a token overflows, it is because the supply was artificially inflated to oblivion, so we probably don't care about it anyways
                require(tokenBalances[address(dao)][GUILD][token] >= amountToRagequit, "insufficient balance");
                tokenBalances[address(dao)][GUILD][token] -= amountToRagequit;
                tokenBalances[address(dao)][memberAddr][token] += amountToRagequit;
                //TODO: do we want to emit an event for each token transfer?
                // emit Transfer(GUILD, applicant, token, amount);
            }
        }
    }

    function isReservedAddress(address applicant) override view external onlyModule(dao) returns (bool) {
        return applicant != address(0x0) && applicant != GUILD && applicant != ESCROW && applicant != TOTAL;
    }

    /**
     * Public read-only functions 
     */
    function balanceOf(address user, address token) override external view returns (uint256) {
        return tokenBalances[address(dao)][user][token];
    }

    function getChunkSize() override view external returns(uint256) {
        return chunkSize;
    }
    
    function getSharesPerChunk() override view external returns(uint256) {
        return sharesPerChunk;
    }

    /**
     * Internal bookkeeping
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

    /**
     * Internal utility
     */
    function fairShare(uint256 balance, uint256 shares, uint256 _totalShares) internal pure returns (uint256) {
        require(_totalShares != 0, "total shares should not be 0");
        if (balance == 0) {
            return 0;
        }
        uint256 prod = balance * shares;
        if (prod / balance == shares) { // no overflow in multiplication above?
            return prod / _totalShares;
        }
        return (balance / _totalShares) * shares;
    }

}