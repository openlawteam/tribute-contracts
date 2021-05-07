pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/DaoConstants.sol";
import "../../../guards/AdapterGuard.sol";
import "../../IExtension.sol";
import "../../bank/Bank.sol";
import "../../../utils/IERC20.sol";
import "../../../helpers/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";


//import "@openzeppelin/contracts/utils/Context.sol";

import "@openzeppelin/contracts/access/AccessControlEnumberable.sol";

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
 The UnitTokenExtension  is a contract to handle an erc20 token that 
 mirrors the number of Units/voting weight held by DAO members. 


  */
contract UnitTokenExtension is
    DaoConstants,
    Bank,
    AdapterGuard,
    IExtension,
    IERC20,
    AccessControlEnumerable,
    ERC20Pausable
{
    //Dao address
    DaoRegistry public dao;
    //Pausable role to prevent transfers
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    /**
     * @notice Initializes the extension with the DAO and Bank address that it belongs to.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "already initialized");
        require(_dao.isMember(creator), "not a member");
        _setupRole(PAUSER_ROLE, _msgSender()); 
        initialized = true;
        dao = _dao;
    }

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        return bank.balanceOf(TOTAL, UNITS);
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        return bank.balanceOf(account, UNITS);
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     * 
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool)
    {
        //TODO check the amount to prevent overflows?
        
        require(dao.isMember(recipient), "receipient is not a member");
        //balance of transferor must be > 0 UNITS
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.balanceOf(msg.sender, UNITS) > 0,
            "sender does not have UNITS to transfer"
        );
        //check UnitToken balance using Bank contract
        require(
            bank.balanceOf(TOTAL, UNITS) > 0,
            "bank does not have enough UNITS to transfer"
        );

        //update member UNITS by amount
        bank.internalTransfer(msg.sender, recipient, UNITS, amount);

        //emit Transfer(msg.sender, recipient, amount);
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256); 

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */

    function approve(address spender, uint256 amount) external returns (bool) {
            require(bank.balanceOf(msg.sender, UNITS) > 0,"owner does not have UNITS to transfer");
            //use IERC20 approve
            IERC20 erc20 = IERC20(UNITS);
            erc20.approve(spender, amount);
            //emit Approval(msg.sender, spender, amount);
    };

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *  Recipient must be a member of DAO 
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool){
        //recipients must be a member of DAO
        require (dao.isMember(recipient),"recipient is not a member" );
        //get bank address
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
      
        //check UnitToken balance using Bank contract
        require(
            bank.balanceOf(TOTAL, UNITS) > 0,
            "bank does not have enough UNITS to transfer"
        );
        //TODO: do we need to add a function reduce the caller's allowance here before transfer?

        // caller transfers UNITS from sender to recipient - use IERC20 transferFrom instead?
        bank.internalTransfer(sender, recipient, UNITS, amount);
        
    };


    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to unpause");
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }


    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}
