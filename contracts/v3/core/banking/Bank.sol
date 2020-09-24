pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../Registry.sol";
import "../Module.sol";
import "../interfaces/IBank.sol";
import "../../utils/SafeMath.sol";
import "../../utils/IERC20.sol";
import "../../guards/ModuleGuard.sol";

contract BankContract is IBank, Module, ModuleGuard {
    using SafeMath for uint256;

    event TokensCollected(
        address indexed moloch,
        address indexed token,
        uint256 amountToCollect
    );
    event Transfer(
        address indexed fromAddress,
        address indexed toAddress,
        address token,
        uint256 amount
    );

    address public constant GUILD = address(0xdead);
    address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);
    uint256 public constant MAX_TOKENS = 100;

    struct BankingState {
        address[] tokens;
        mapping(address => bool) availableTokens;
        mapping(address => mapping(address => uint256)) tokenBalances;
    }

    mapping(address => BankingState) private states;

    function addToEscrow(
        Registry dao,
        address token,
        uint256 amount
    ) external override onlyModule(dao) {
        require(
            token != GUILD && token != ESCROW && token != TOTAL,
            "invalid token"
        );
        unsafeAddToBalance(address(dao), ESCROW, token, amount);
        if (!states[address(dao)].availableTokens[token]) {
            require(
                states[address(dao)].tokens.length < MAX_TOKENS,
                "max limit reached"
            );
            states[address(dao)].availableTokens[token] = true;
            states[address(dao)].tokens.push(token);
        }
    }

    function addToGuild(
        Registry dao,
        address token,
        uint256 amount
    ) external override onlyModule(dao) {
        require(
            token != GUILD && token != ESCROW && token != TOTAL,
            "invalid token"
        );
        unsafeAddToBalance(address(dao), GUILD, token, amount);
        if (!states[address(dao)].availableTokens[token]) {
            require(
                states[address(dao)].tokens.length < MAX_TOKENS,
                "max limit reached"
            );
            states[address(dao)].availableTokens[token] = true;
            states[address(dao)].tokens.push(token);
        }
    }

    function transferFromGuild(
        Registry dao,
        address applicant,
        address token,
        uint256 amount
    ) external override onlyModule(dao) {
        require(
            states[address(dao)].tokenBalances[GUILD][token] >= amount,
            "insufficient balance"
        );
        unsafeSubtractFromBalance(address(dao), GUILD, token, amount);
        unsafeAddToBalance(address(dao), applicant, token, amount);
        emit Transfer(GUILD, applicant, token, amount);
    }

    function ragequit(
        Registry dao,
        address memberAddr,
        uint256 sharesToBurn
    ) external override onlyModule(dao) {
        //Get the total shares before burning member shares
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        uint256 totalShares = memberContract.getTotalShares();
        //Burn shares if member has enough shares
        memberContract.burnShares(dao, memberAddr, sharesToBurn);
        //Update internal Guild and Member balances
        for (uint256 i = 0; i < states[address(dao)].tokens.length; i++) {
            address token = states[address(dao)].tokens[i];
            uint256 amountToRagequit = fairShare(
                states[address(dao)].tokenBalances[GUILD][token],
                sharesToBurn,
                totalShares
            );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                states[address(dao)]
                    .tokenBalances[GUILD][token] -= amountToRagequit;
                states[address(dao)]
                    .tokenBalances[memberAddr][token] += amountToRagequit;
                //TODO: do we want to emit an event for each token transfer?
                // emit Transfer(GUILD, applicant, token, amount);
            }
        }
    }

    function isNotReservedAddress(address applicant)
        external
        override
        pure
        returns (bool)
    {
        return
            applicant != address(0x0) &&
            applicant != GUILD &&
            applicant != ESCROW &&
            applicant != TOTAL;
    }

    /**
     * Public read-only functions
     */
    function balanceOf(
        Registry dao,
        address user,
        address token
    ) external override view returns (uint256) {
        return states[address(dao)].tokenBalances[user][token];
    }

    /**
     * Internal bookkeeping
     */
    function unsafeAddToBalance(
        address dao,
        address user,
        address token,
        uint256 amount
    ) internal {
        states[dao].tokenBalances[user][token] += amount;
        states[dao].tokenBalances[TOTAL][token] += amount;
    }

    function unsafeSubtractFromBalance(
        address dao,
        address user,
        address token,
        uint256 amount
    ) internal {
        states[dao].tokenBalances[user][token] -= amount;
        states[dao].tokenBalances[TOTAL][token] -= amount;
    }

    function unsafeInternalTransfer(
        address dao,
        address from,
        address to,
        address token,
        uint256 amount
    ) internal {
        unsafeSubtractFromBalance(dao, from, token, amount);
        unsafeAddToBalance(dao, to, token, amount);
    }

    /**
     * Internal utility
     */
    function fairShare(
        uint256 balance,
        uint256 shares,
        uint256 _totalShares
    ) internal pure returns (uint256) {
        require(_totalShares != 0, "total shares should not be 0");
        if (balance == 0) {
            return 0;
        }
        uint256 prod = balance * shares;
        if (prod / balance == shares) {
            // no overflow in multiplication above?
            return prod / _totalShares;
        }
        return (balance / _totalShares) * shares;
    }
}
