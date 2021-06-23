import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "../../generated/templates/BankExtension/BankExtension";
import { ERC20Extension } from "../../generated/templates/BankExtension/ERC20Extension";
import {
  Member,
  TributeDao,
  Token,
  TokenHolder,
  Extension,
} from "../../generated/schema";
import {
  GUILD,
  UNITS,
  TOTAL,
  MEMBER_COUNT,
  ERC20_EXTENSION_ID,
} from "../helpers/constants";

function internalTransfer(
  createdAt: string,
  extensionAddress: Address,
  memberAddress: Address,
  tokenAddress: Address
): void {
  // get bank extension bindings
  let bankRegistry = BankExtension.bind(extensionAddress);
  // get dao address
  let daoAddress = bankRegistry.dao();
  // initialize an array
  let tributeDaos: string[] = [];

  if (
    TOTAL.toHex() != memberAddress.toHex() &&
    GUILD.toHex() != memberAddress.toHex() &&
    MEMBER_COUNT.toHex() != memberAddress.toHex() &&
    TOTAL.toHex() != tokenAddress.toHex() &&
    GUILD.toHex() != tokenAddress.toHex() &&
    MEMBER_COUNT.toHex() != tokenAddress.toHex()
  ) {
    // check if the DAO has an ERC20 extension and assign members balance
    internalERC20Balance(daoAddress, memberAddress);

    let member = Member.load(memberAddress.toHex());

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

    /**
     * get `balanceOf` for members UNITS
     */

    // get balanceOf member units
    let balanceOfUNITS = bankRegistry.balanceOf(memberAddress, UNITS);
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

    member.save();
  }

  // get totalUnits in the dao
  let balanceOfTotalUnits = bankRegistry.balanceOf(TOTAL, UNITS);
  let dao = TributeDao.load(daoAddress.toHexString());

  if (dao != null) {
    dao.totalUnits = balanceOfTotalUnits.toString();

    dao.save();
  }
}

export function internalERC20Balance(
  daoAddress: Address,
  memberAddress: Address
): void {
  // check and get ERC20 extension address
  let erc20ExtensionId = daoAddress
    .toHex()
    .concat("-extension-")
    .concat(ERC20_EXTENSION_ID);
  let erc20Extension = Extension.load(erc20ExtensionId);

  if (erc20Extension != null) {
    let erc20ExtensionRegistry = ERC20Extension.bind(
      Address.fromString(erc20Extension.extensionAddress.toHexString())
    );

    // erc20 token details
    let name = erc20ExtensionRegistry.name();
    let symbol = erc20ExtensionRegistry.symbol();
    let totalSupply = erc20ExtensionRegistry.totalSupply();

    let balance = erc20ExtensionRegistry.balanceOf(memberAddress);

    let tokenId = daoAddress
      .toHex()
      .concat("-token-")
      .concat(erc20Extension.extensionAddress.toHex());

    let token = Token.load(tokenId);

    if (token == null) {
      token = new Token(tokenId);

      token.symbol = symbol;
      token.name = name;
      token.tokenAddress = erc20Extension.extensionAddress;
    }

    token.totalSupply = totalSupply;

    token.save();

    // update holder
    let tokenHolderId = daoAddress
      .toHex()
      .concat("-tokenholder-")
      .concat(memberAddress.toHex());

    let tokenHolder = TokenHolder.load(tokenHolderId);

    if (tokenHolder == null) {
      tokenHolder = new TokenHolder(tokenHolderId);

      tokenHolder.member = memberAddress.toHex();
      tokenHolder.token = tokenId;
    }

    tokenHolder.balance = balance;

    tokenHolder.save();
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
