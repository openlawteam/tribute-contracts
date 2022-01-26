// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";

abstract contract Gelatofied {
    address payable public immutable gelato;

    modifier gelatofy(DaoRegistry dao, uint256 _amount) {
        require(
            gelato == address(0x1) || msg.sender == gelato,
            "Gelatofied: Only gelato"
        );

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

        // slither-disable-next-line unused-return
        try bank.supportsInterface(bank.withdrawTo.selector) returns (
            // slither-disable-next-line uninitialized-local,variable-scope
            bool supportsInterface
        ) {
            if (supportsInterface) {
                bank.withdrawTo(
                    dao,
                    DaoHelper.GUILD,
                    gelato,
                    DaoHelper.ETH_TOKEN,
                    _amount
                );
            } else {
                bank.internalTransfer(
                    dao,
                    DaoHelper.GUILD,
                    gelato,
                    DaoHelper.ETH_TOKEN,
                    _amount
                );
                bank.withdraw(dao, gelato, DaoHelper.ETH_TOKEN, _amount);
            }
        } catch {
            //if supportsInterface reverts ( function does not exist, assume it does not have withdrawTo )
            bank.internalTransfer(
                dao,
                DaoHelper.GUILD,
                gelato,
                DaoHelper.ETH_TOKEN,
                _amount
            );
            bank.withdraw(dao, gelato, DaoHelper.ETH_TOKEN, _amount);
        }
        _;

        (bool success, ) = gelato.call{value: _amount}("");
        require(success, "Gelatofied: Gelato fee failed");
    }

    constructor(address payable _gelato) {
        require(_gelato != address(0), "Gelato can not be zero address");

        gelato = _gelato;
    }
}
