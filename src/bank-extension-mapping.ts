import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "../generated/templates/BankExtension/BankExtension";
import { Member, Molochv3, Token, TokenBalance } from "../generated/schema";
import { GUILD, LOCKED_LOOT, LOOT, SHARES, TOTAL } from "./helpers/constants";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

function internalTransfer(
  createdAt: string,
  extensionAddress: Address,
  memberAddress: Address,
  tokenAddress: Address
): void {
  // get bank extension bindings
  let registry = BankExtension.bind(extensionAddress);
  let daoAddress = registry.dao();

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
      member.isJailed = false;
    }

    if (token == null) {
      token = new Token(tokenAddress.toHex());
      token.tokenAddress = tokenAddress;
    }

    if (tokenBalance == null) {
      tokenBalance = new TokenBalance(membertokenBalanceId);
      // we give it an initial 0 balance
      tokenBalance.tokenBalance = BigInt.fromI32(0);
    }

    /**
     * get `balanceOf`
     */

    // get balanceOf member shares
    let balanceOfSHARES = registry.balanceOf(memberAddress, SHARES);
    member.shares = balanceOfSHARES;

    // get balanceOf member loot
    let balanceOfLOOT = registry.balanceOf(memberAddress, LOOT);
    member.loot = balanceOfLOOT;

    // get balanceOf member locked loot
    let balanceOfLOCKED_LOOT = registry.balanceOf(memberAddress, LOCKED_LOOT);
    member.lockedLoot = balanceOfLOCKED_LOOT;

    // omit the `TOTAL` & `GUILD` addresses from the ragequit check
    if (
      TOTAL.toHex() != memberAddress.toHex() &&
      GUILD.toHex() != memberAddress.toHex()
    ) {
      let didFullyRagequit =
        balanceOfSHARES.equals(BigInt.fromI32(0)) &&
        balanceOfLOOT.equals(BigInt.fromI32(0)) &&
        balanceOfLOCKED_LOOT.equals(BigInt.fromI32(0));

      // fully raged quit
      member.didFullyRagequit = didFullyRagequit;
    }

    tokenBalance.token = tokenAddress.toHex();
    tokenBalance.member = memberAddress.toHex();

    tokenBalance.tokenBalance = balanceOfSHARES
      .plus(balanceOfLOOT)
      .plus(balanceOfLOCKED_LOOT);

    member.save();
    token.save();
    tokenBalance.save();
  }

  // get totalShares in the dao
  let balanceOfTotalShares = registry.balanceOf(TOTAL, SHARES);
  let dao = Molochv3.load(daoAddress.toHexString());

  if (dao != null) {
    dao.totalShares = balanceOfTotalShares.toString();

    dao.save();
  }
}

// event NewBalance(address member, address tokenAddr, uint256 amount);
export function handleNewBalance(event: NewBalance): void {
  log.info(
    "**************** handleNewBalance event fired. member {}, tokenAddr {}, amount {}",
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
    "**************** handleWithdraw event fired. account {}, tokenAddr {}, amount {}",
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
