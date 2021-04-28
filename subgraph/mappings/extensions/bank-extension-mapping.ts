import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "../../generated/templates/BankExtension/BankExtension";
import { ERC20 } from "../../generated/templates/BankExtension/ERC20";
import {
  Member,
  TributeDao,
  Token,
  TokenBalance,
} from "../../generated/schema";
import { GUILD, UNITS, TOTAL } from "../helpers/constants";

function internalTransfer(
  createdAt: string,
  extensionAddress: Address,
  memberAddress: Address,
  tokenAddress: Address
): void {
  // get bank extension bindings
  let registry = BankExtension.bind(extensionAddress);
  let daoAddress = registry.dao();

  let tributeDaos: string[] = [];

  if (
    TOTAL.toHex() != memberAddress.toHex() &&
    GUILD.toHex() != memberAddress.toHex()
  ) {
    let membertokenBalanceId = daoAddress
      .toHex()
      .concat("-tokenbalances-")
      .concat(memberAddress.toHex());

    let member = Member.load(memberAddress.toHex());
    let token = Token.load(tokenAddress.toHex());
    let tokenBalance = TokenBalance.load(membertokenBalanceId);

    if (member == null) {
      member = new Member(memberAddress.toHex());
      member.createdAt = createdAt;
      member.memberAddress = memberAddress;
      member.delegateKey = memberAddress;
      member.isDelegated = false;
    } else {
      // get members daos
      tributeDaos = member.tributeDaos;
    }

    // create 1-1 relationship between member and dao
    tributeDaos.push(daoAddress.toHexString());
    // add members daos
    member.tributeDaos = tributeDaos;

    if (token == null) {
      token = new Token(tokenAddress.toHex());
      token.tokenAddress = tokenAddress;

      // get additional ERC20 info
      let erc20Registry = ERC20.bind(tokenAddress);

      // try get the token name
      let callResult_name = erc20Registry.try_name();
      if (callResult_name.reverted) {
        log.info("try_name reverted", []);
      } else {
        token.name = callResult_name.value;
      }

      // try get the token symbol
      let callResult_symbol = erc20Registry.try_symbol();
      if (callResult_symbol.reverted) {
        log.info("try_symbol reverted", []);
      } else {
        token.symbol = callResult_symbol.value;
      }
    }

    if (tokenBalance == null) {
      tokenBalance = new TokenBalance(membertokenBalanceId);
      // we give it an initial 0 balance
      tokenBalance.tokenBalance = BigInt.fromI32(0);
      tokenBalance.tributeDao = daoAddress.toHex();

      let bankId = daoAddress
        .toHex()
        .concat("-bank-")
        .concat(extensionAddress.toHex());
      tokenBalance.bank = bankId;
    }

    /**
     * get `balanceOf` for members UNITS
     */

    // get balanceOf member units
    let balanceOfUNITS = registry.balanceOf(memberAddress, UNITS);
    member.units = balanceOfUNITS;

    // omit the `TOTAL` & `GUILD` addresses from the ragequit check
    if (
      TOTAL.toHex() != memberAddress.toHex() &&
      GUILD.toHex() != memberAddress.toHex()
    ) {
      let didFullyRagequit = balanceOfUNITS.equals(BigInt.fromI32(0));

      // fully raged quit
      member.didFullyRagequit = didFullyRagequit;
    }

    tokenBalance.token = tokenAddress.toHex();
    tokenBalance.member = memberAddress.toHex();

    tokenBalance.tokenBalance = balanceOfUNITS;

    member.save();
    token.save();
    tokenBalance.save();
  }

  // get totalUnits in the dao
  let balanceOfTotalUnits = registry.balanceOf(TOTAL, UNITS);
  let dao = TributeDao.load(daoAddress.toHexString());

  if (dao != null) {
    dao.totalUnits = balanceOfTotalUnits.toString();

    dao.save();
  }
}

export function handleNewBalance(event: NewBalance): void {
  log.info(
    "================ NewBalance event fired. member {}, tokenAddr {}, amount {}",
    [
      event.params.member.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
    ]
  );

  log.info("event.address, {}", [event.address.toHex()]);

  internalTransfer(
    event.block.timestamp.toString(),
    event.address,
    event.params.member,
    event.params.tokenAddr
  );
}

// event Withdraw(address member, address tokenAddr, uint256 amount);
export function handleWithdraw(event: Withdraw): void {
  log.info(
    "================ Withdraw event fired. account {}, tokenAddr {}, amount {}",
    [
      event.params.account.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
    ]
  );

  internalTransfer(
    "",
    event.address,
    event.params.account,
    event.params.tokenAddr
  );
}
