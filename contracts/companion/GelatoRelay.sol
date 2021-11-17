pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../helpers/DaoHelper.sol";
import "./Gelatofied.sol";
import "./GelatoBytes.sol";

contract GelatoRelay is Gelatofied {
    using GelatoBytes for bytes;

    // solhint-disable-next-line no-empty-blocks
    constructor(address payable _gelato) Gelatofied(_gelato) {}

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function sufficientFee(
        address _dest,
        bytes memory _data,
        uint256 _desiredFee,
        address
    )
        external
        returns (
            bool canExec,
            uint256 receivedFee,
            uint256 desiredFeee
        )
    {
        DaoRegistry dao = _getDao(_data);
        require(dao.isAdapter(_dest), "not part of the dao");

        (bool success, bytes memory returndata) = _dest.call(_data);
        if (!success) returndata.revertWithError("Relay.sufficientFee:");
        BankExtension bank = BankExtension(
            dao.getExtensionAddress((DaoHelper.BANK))
        );

        uint256 balance = bank.balanceOf(DaoHelper.GUILD, DaoHelper.ETH_TOKEN);
        if (balance < _desiredFee) return (false, balance, _desiredFee);
        return (true, balance, _desiredFee);
    }

    function _getDao(bytes memory bys) internal pure returns (DaoRegistry dao) {
        address addr;
        assembly {
            addr := mload(add(bys, 36))
        }

        return DaoRegistry(addr);
    }

    function exec(
        address _dest,
        bytes memory _data,
        uint256 _desiredFee,
        address
    ) external gelatofy(_desiredFee) {
        DaoRegistry dao = _getDao(_data);
        require(dao.isAdapter(_dest), "not part of the dao");
        (bool success, bytes memory returndata) = _dest.call(_data);
        if (!success) returndata.revertWithError("Relay.exec:");
    }
}
