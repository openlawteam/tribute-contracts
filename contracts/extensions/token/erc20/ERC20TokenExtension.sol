pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/DaoConstants.sol";
import "../../../guards/AdapterGuard.sol";
import "../../../utils/PotentialNewMember.sol";
import "../../IExtension.sol";
import "../../bank/Bank.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

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

/**
 *
 * The ERC20Extension is a contract to give erc20 functionality
 * to the internal token units held by DAO members inside the DAO itself.
 */
contract ERC20Extension is
    DaoConstants,
    AdapterGuard,
    PotentialNewMember,
    IExtension,
    IERC20
{
    // The DAO address that this extension belongs to
    DaoRegistry public dao;

    // The custom configuration to set the transfer type, e.g:
    // (0: transfers are enabled only between dao members)
    // (1: transfers are enabled between dao members and external accounts)
    // (2: all transfers are paused)
    bytes32 public constant ERC20_EXT_TRANSFER_TYPE =
        keccak256("erc20ExtTransferType");

    bytes32 internal constant TokenName =
        keccak256("erc20.extension.tokenName");
    bytes32 internal constant TokenSymbol =
        keccak256("erc20.extension.tokenSymbol");


    // Internally tracks deployment under eip-1167 proxy pattern
    bool public initialized = false;

    // The token address managed by the DAO that tracks the internal transfers
    address public tokenAddress;

    // The number of decimals of the token managed by the DAO
    uint8 public tokenDecimals;

    // Tracks all the token allowances: owner => spender => amount
    mapping(address => mapping(address => uint256)) private _allowances;

    /// @notice Clonable contract must have an empty constructor
    // constructor() {}

    /**
     * @notice Initializes the extension with the DAO that it belongs to,
     * and checks if the parameters were set.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "already initialized");
        require(_dao.isMember(creator), "not a member");
        require(tokenAddress != address(0x0), "missing token address");
        initialized = true;
        dao = _dao;
    }

    function bytes32ToString(bytes32 _bytes32)
        internal
        pure
        returns (string memory)
    {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    /**
     * @dev Returns the token address managed by the DAO that tracks the
     * internal transfers.
     */
    function token() public view virtual returns (address) {
        return tokenAddress;
    }

    /**
     * @dev Sets the token address if the extension is not initialized,
     * not reserved and not zero.
     */
    function setToken(address _tokenAddress) external {
        require(!initialized, "already initialized");
        require(_tokenAddress != address(0x0), "invalid token address");
        require(
            isNotReservedAddress(_tokenAddress),
            "token address already in use"
        );

        tokenAddress = _tokenAddress;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() external view virtual returns (string memory) {
        return bytes32ToString(bytes32(dao.getConfiguration(TokenName)));
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view virtual returns (string memory) {
        return bytes32ToString(bytes32(dao.getConfiguration(TokenSymbol)));
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     */
    function decimals() public view virtual returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @dev Sets the token decimals if the extension is not initialized.
     */
    function setDecimals(uint8 _decimals) external {
        require(!initialized, "already initialized");
        tokenDecimals = _decimals;
    }

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() public view override returns (uint256) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        return bank.balanceOf(TOTAL, tokenAddress);
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) public view override returns (uint256) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        return bank.balanceOf(account, tokenAddress);
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     * @param spender The address account that will have the units decremented.
     * @param amount The amount to decrement from the spender account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount)
        public
        override
        reentrancyGuard(dao)
        returns (bool)
    {
        address senderAddr = dao.getAddressIfDelegated(msg.sender);
        require(
            isNotZeroAddress(senderAddr),
            "ERC20: approve from the zero address"
        );
        require(
            isNotZeroAddress(spender),
            "ERC20: approve to the zero address"
        );
        require(dao.isMember(senderAddr), "sender is not a member");
        require(
            isNotReservedAddress(spender),
            "spender can not be a reserved address"
        );

        _allowances[senderAddr][spender] = amount;
        emit Approval(senderAddr, spender, amount);
        return true;
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     * @dev The transfer operation follows the DAO configuration specified
     * by the ERC20_EXT_TRANSFER_TYPE property.
     * @param recipient The address account that will have the units incremented.
     * @param amount The amount to increment in the recipient account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        reentrancyGuard(dao)
        returns (bool)
    {
        address senderAddr = dao.getAddressIfDelegated(msg.sender);
        require(
            isNotZeroAddress(recipient),
            "ERC20: transfer to the zero address"
        );

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.balanceOf(senderAddr, tokenAddress) >= amount && amount > 0,
            "sender does not have units to transfer"
        );

        uint256 transferType = dao.getConfiguration(ERC20_EXT_TRANSFER_TYPE);
        if (transferType == 0) {
            // members only transfer
            require(dao.isMember(recipient), "recipient is not a member");
            bank.internalTransfer(senderAddr, recipient, tokenAddress, amount);
            emit Transfer(senderAddr, recipient, amount);
            return true;
        } else if (transferType == 1) {
            // external transfer
            require(
                isNotReservedAddress(recipient),
                "recipient address can not be reserved"
            );
            bank.internalTransfer(senderAddr, recipient, tokenAddress, amount);
            potentialNewMember(recipient, dao, bank);
            emit Transfer(senderAddr, recipient, amount);
            return true;
        } else if (transferType == 2) {
            // closed/paused transfers
            return false;
        }
        return false;
    }

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     * @dev The transfer operation follows the DAO configuration specified
     * by the ERC20_EXT_TRANSFER_TYPE property.
     * @param sender The address account that will have the units decremented.
     * @param recipient The address account that will have the units incremented.
     * @param amount The amount to decrement from the sender account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override reentrancyGuard(dao) returns (bool) {
        require(
            isNotZeroAddress(recipient),
            "ERC20: transferFrom recipient can not be zero address"
        );

        address senderAddr = dao.getAddressIfDelegated(sender);
        uint256 currentAllowance = _allowances[senderAddr][msg.sender];
        //check if sender has approved msg.sender to spend amount
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.balanceOf(senderAddr, tokenAddress) >= amount && amount > 0,
            "bank does not have enough units to transfer"
        );

        uint256 transferType = dao.getConfiguration(ERC20_EXT_TRANSFER_TYPE);
        if (transferType == 0) {
            // members only transfer
            require(dao.isMember(recipient), "recipient is not a member");

            _allowances[senderAddr][msg.sender] = currentAllowance - amount;

            bank.internalTransfer(senderAddr, recipient, tokenAddress, amount);
            emit Transfer(senderAddr, recipient, amount);

            return true;
        } else if (transferType == 1) {
            // external transfer
            _allowances[senderAddr][msg.sender] = currentAllowance - amount;
            require(
                isNotReservedAddress(recipient),
                "recipient address can not be reserved"
            );
            bank.internalTransfer(senderAddr, recipient, tokenAddress, amount);
            potentialNewMember(recipient, dao, bank);
            emit Transfer(senderAddr, recipient, amount);
            return true;
        } else if (transferType == 2) {
            // closed/paused transfers
            return false;
        }

        return false;
    }
}
