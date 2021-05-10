pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/DaoConstants.sol";
import "../../../guards/AdapterGuard.sol";
import "../../IExtension.sol";
import "../../bank/Bank.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
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
 The UnitTokenExtension is a contract to give erc20 functionality
 to the internal token UNITS held by DAO members inside the DAO itself. 

  */
contract UnitTokenExtension is
    Context,
    DaoConstants,
    AdapterGuard,
    IExtension,
    //AccessControlEnumerable,
    //ERC20
    IERC20
{
    //Dao address
    DaoRegistry public dao;
    //Pausable role to prevent transfers
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bool public initialized = false; 

    mapping(address => mapping (address => uint256)) private _allowances;
    
    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    //  modifier hasExtensionAccess(IExtension extension, AclFlag flag) {
    //     require(
    //         dao.state() == DaoRegistry.DaoState.CREATION ||
    //             dao.hasAdapterAccessToExtension(
    //                 msg.sender,
    //                 address(extension),
    //                 uint8(flag)
    //             ),
    //         "unitToken::accessDenied"
    //     );
    //     _;
    // }

    /**
     * @notice Initializes the extension with the DAO and Bank address that it belongs to.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "already initialized");
        require(_dao.isMember(creator), "not a member");
        // TODO add access control layer
        initialized = true;
        dao = _dao;
    }

/**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return "Unit Token";
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return "UNIT";
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overloaded;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }


    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() public override view returns (uint256) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        return bank.balanceOf(TOTAL, UNITS);
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) public override view returns (uint256) {
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
        public override
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
        public
        override
        view
        returns (uint256) {
            return _allowances[owner][spender];
        }

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

    function approve(address spender, uint256 amount) public override returns (bool) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.balanceOf(msg.sender, UNITS) > amount && amount > 0,"spender does not have UNITS to transfer");    
        return true;
        //emit Approval(msg.sender, spender, amount);
    }


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
    ) public override returns (bool){
        //recipients must be a member of DAO
        require (dao.isMember(recipient),"recipient is not a member" );
        //get bank address

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        //check UnitToken balance using Bank contract
        require(
            bank.balanceOf(TOTAL, UNITS) > 0,
            "bank does not have enough UNITS to transfer"
        );
        //use Openzeppelin's erc20 _allowances mapping
    
        uint256 currentAllowance = _allowances[sender][_msgSender()];
        //approval check for sender
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        //adjust allowance with erc20 _approve 
        //_approve(sender, _msgSender(), currentAllowance - amount);
        // caller transfers UNITS from sender to recipient insde the Bank
        bank.internalTransfer(sender, recipient, UNITS, amount);
        
        return true; 
    }


}
