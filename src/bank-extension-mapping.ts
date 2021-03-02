import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "../generated/templates/BankExtension/BankExtension";
import { Member, Molochv3, Token, TokenBalance } from "../generated/schema";
import { LOCKED_LOOT, LOOT, SHARES, TOTAL } from "./dao-constants";
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

// helpers
// function subtractFromBalance(
//   laoId: string,
//   member: Bytes,
//   token: string,
//   amount: BigInt
// ): string {
//   let tokenBalanceId = token.concat("-member-").concat(member.toHex());
//   let balance: TokenBalance | null = TokenBalance.load(tokenBalanceId);

//   balance.tokenBalance = balance.tokenBalance.minus(amount);

//   balance.save();

//   return tokenBalanceId;
// }

function loadOrCreateTokenBalance(
  // molochId: string,
  member: Bytes,
  token: string
): TokenBalance | null {
  let memberTokenBalanceId = token.concat("-member-").concat(member.toHex());
  let tokenBalance = TokenBalance.load(memberTokenBalanceId);
  let tokenBalanceDNE = tokenBalance == null ? true : false;
  if (tokenBalanceDNE) {
    createMemberTokenBalance(member, token, BigInt.fromI32(0));
    return TokenBalance.load(memberTokenBalanceId);
  } else {
    return tokenBalance;
  }
}
function addToBalance(
  // molochId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let tokenBalanceId = token.concat("-member-").concat(member.toHex());
  log.info("********** add (or create) to balance " + member.toHex(), []);
  let balance: TokenBalance | null = loadOrCreateTokenBalance(member, token);
  balance.tokenBalance = balance.tokenBalance.plus(amount);
  balance.save();
  return tokenBalanceId;
}
function subtractFromBalance(
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let tokenBalanceId = token.concat("-member-").concat(member.toHex());
  log.info("********** substract from balance " + member.toHex(), []);
  let balanceUnsafe: TokenBalance | null = TokenBalance.load(tokenBalanceId);
  if (balanceUnsafe == null) {
    log.info(
      "********** error while substracting balance from missing balance " +
        member.toHex(),
      []
    );
  }
  let balance =
    balanceUnsafe == null ? new TokenBalance(tokenBalanceId) : balanceUnsafe;
  balance.tokenBalance = balance.tokenBalance.minus(amount);

  balance.save();
  return tokenBalanceId;
}

export function createMemberTokenBalance(
  // molochId: string,
  member: Bytes,
  token: string,
  amount: BigInt
): string {
  let memberId = member.toHex(); //molochId.concat("-member-").concat(member.toHex());
  let memberTokenBalanceId = token.concat("-member-").concat(member.toHex());
  let memberTokenBalance = new TokenBalance(memberTokenBalanceId);

  // memberTokenBalance.moloch = molochId;
  memberTokenBalance.token = token;
  memberTokenBalance.tokenBalance = amount;
  memberTokenBalance.member = memberId;
  // memberTokenBalance.guildBank = false;
  // memberTokenBalance.ecrowBank = false;
  // memberTokenBalance.memberBank = true;

  memberTokenBalance.save();
  return memberTokenBalanceId;
}

function internalTransfer(
  // molochId: string,
  from: Bytes,
  to: Bytes,
  token: string,
  amount: BigInt
): void {
  subtractFromBalance(from, token, amount);
  addToBalance(to, token, amount);
}

export function handleNewBalance(event: NewBalance): void {
  let tokenId = event.params.tokenAddr.toHex();
  let memberId = event.params.member.toHex();
  let amount = event.params.amount;
  let tokenBalanceId = memberId + ":" + tokenId;

  log.info(
    "**************** handleNewBalance event fired. member {}, tokenAddr {}, amount {}",
    [
      event.params.member.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
    ]
  );

  //.concat("-member-").concat(tokenId);
  let member = Member.load(memberId);
  let token = Token.load(tokenId);
  let tokenBalance = TokenBalance.load(tokenBalanceId);

  if (member == null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.delegateKey = event.params.member;
    member.jailed = false;
    member.memberAddress = event.params.member;
  }

  if (token == null) {
    token = new Token(tokenId);
    token.tokenAddress = event.params.tokenAddr;
  }

  //----
  // log.info("********** add (or create) to balance " + member.toHex(), []);
  // let balance: TokenBalance | null = loadOrCreateTokenBalance(
  //   memberId,
  //   token
  // );
  // balance.tokenBalance = balance.tokenBalance.plus(amount);
  // balance.save();
  //----
  if (tokenBalance == null) {
    // format - memberId:tokenId;
    tokenBalance = new TokenBalance(tokenBalanceId);
    // resolves - `Value is not a BigInt.` issue; because `tokenBalance`
    // wasn't set, so we give it an initial 0 balance
    tokenBalance.tokenBalance = BigInt.fromI32(0);
  }

  tokenBalance.token = tokenId;
  tokenBalance.tokenBalance = tokenBalance.tokenBalance.plus(amount);
  tokenBalance.member = memberId;

  // internalTransfer(event.params.member, event.params.member, tokenId, amount);

  // get bank extension bindings
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
  // let callResultTotalShares = registry.try_balanceOf(TOTAL, SHARES);
  // if (callResultTotalShares.reverted) {
  //   log.info("getBalanceOf laoland:totalShares reverted", []);
  // } else {
  //   if (dao !== null) {
  //     dao.totalShares = callResultTotalShares.value.toString();

  //     dao.save();
  //   }
  // }

  member.save();
  token.save();
  tokenBalance.save();
}

export function handleWithdraw(event: Withdraw): void {
  // let daoAddress = event.address.toHexString();
  let tokenId = event.params.tokenAddr.toHex();
  // daoAddress
  //   .concat("-token-")
  //   .concat(event.params.tokenAddr.toHex());

  log.info(
    "**************** handleWithdraw event fired. account {}, tokenAddr {}, amount {}",
    [
      event.params.account.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
      // daoAddress,
    ]
  );

  // if (event.params.amount > BigInt.fromI32(0)) {
  //   subtractFromBalance(
  //     // daoAddress,
  //     event.transaction.from,
  //     tokenId,
  //     event.params.amount
  //   );
  // }
}
