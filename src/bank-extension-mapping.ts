import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "../generated/BankExtension/BankExtension";
import { Laoland, Member, Token, TokenBalance } from "../generated/schema";
import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";
let SHARES: Address = Address.fromString(
  "0x00000000000000000000000000000000000Ff1CE"
);
let LOCKED_LOOT: Address = Address.fromString(
  "0x00000000000000000000000000000000BaaaAaad"
);
let LOOT: Address = Address.fromString(
  "0x00000000000000000000000000000000b105f00D"
);
let GUILD: Address = Address.fromString(
  "0x000000000000000000000000000000000000dEaD"
);
let TOTAL: Address = Address.fromString(
  "0x000000000000000000000000000000000000baBe"
);

// helpers
function subtractFromBalance(
  laoId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let tokenBalanceId = token.concat("-member-").concat(member.toHex());
  let balance: TokenBalance | null = TokenBalance.load(tokenBalanceId);

  balance.tokenBalance = balance.tokenBalance.minus(amount);

  balance.save();
  return tokenBalanceId;
}

export function handleNewBalance(event: NewBalance): void {
  let laolandId = event.address.toHexString();
  let memberId = laolandId
    .concat("-member-")
    .concat(event.params.member.toHex());
  let tokenId = event.params.tokenAddr.toHex();
  // let amount = event.params.amount;
  let tokenBalanceId = memberId + ":" + tokenId;

  let lao = Laoland.load(laolandId);
  let member = Member.load(memberId);
  let token = Token.load(tokenId);
  let tokenBalance = TokenBalance.load(tokenBalanceId);

  if (member == null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.delegateKey = event.params.member;
    member.jailed = false;
  }
  member.memberAddress = event.params.member;

  // @todo get all laos the member belongs to
  // let laoMemberships: string[] = [];
  // member.laolands = laoMemberships;

  let registry = BankExtension.bind(event.address);

  // get balanceOf member shares
  let callResultSHARES = registry.try_balanceOf(event.params.member, SHARES);
  if (callResultSHARES.reverted) {
    log.info("getBalanceOf member:shares reverted", []);
  } else {
    member.shares = callResultSHARES.value;
  }

  // get balanceOf member loot
  let callResultLOOT = registry.try_balanceOf(event.params.member, LOOT);
  if (callResultLOOT.reverted) {
    log.info("getBalanceOf member:loot reverted", []);
  } else {
    member.loot = callResultLOOT.value;
  }

  // get balanceOf member locked loot
  let callResultLOCKED_LOOT = registry.try_balanceOf(
    event.params.member,
    LOCKED_LOOT
  );
  if (callResultLOCKED_LOOT.reverted) {
    log.info("getBalanceOf member:loot reverted", []);
  } else {
    member.lockedLoot = callResultLOCKED_LOOT.value;
  }

  // get totalShares in the lao
  let callResultTotalShares = registry.try_balanceOf(TOTAL, SHARES);
  if (callResultTotalShares.reverted) {
    log.info("getBalanceOf laoland:totalShares reverted", []);
  } else {
    if (lao == null) {
      lao = new Laoland(laolandId);
      lao.totalShares = callResultTotalShares.value.toString();

      lao.save();
    }
  }

  if (token == null) {
    token = new Token(tokenId);
    token.tokenAddress = event.params.tokenAddr;
  }

  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(tokenBalanceId);
  }

  tokenBalance.token = tokenId;
  tokenBalance.tokenBalance = event.params.amount;

  log.info(
    "**************** handleNewBalance event fired. member {}, tokenAddr {}, amount {}",
    [
      event.params.member.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toHexString(),
    ]
  );

  member.save();
  token.save();
  tokenBalance.save();
}

export function handleWithdraw(event: Withdraw): void {
  let laoId = event.address.toHexString();
  let tokenId = laoId.concat("-token-").concat(event.params.tokenAddr.toHex());

  log.info(
    "**************** handleWithdraw event fired. account {}, tokenAddr {}, amount {}",
    [
      event.params.account.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toHexString(),
    ]
  );

  if (event.params.amount > BigInt.fromI32(0)) {
    subtractFromBalance(
      laoId,
      event.transaction.from,
      tokenId,
      event.params.amount
    );
  }
}
