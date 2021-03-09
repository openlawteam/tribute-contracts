// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Molochv3 extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Molochv3 entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Molochv3 entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Molochv3", id.toString(), this);
  }

  static load(id: string): Molochv3 | null {
    return store.get("Molochv3", id) as Molochv3 | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get daoAddress(): Bytes | null {
    let value = this.get("daoAddress");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set daoAddress(value: Bytes | null) {
    if (value === null) {
      this.unset("daoAddress");
    } else {
      this.set("daoAddress", Value.fromBytes(value as Bytes));
    }
  }

  get name(): string | null {
    let value = this.get("name");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (value === null) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(value as string));
    }
  }

  get creator(): Bytes | null {
    let value = this.get("creator");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set creator(value: Bytes | null) {
    if (value === null) {
      this.unset("creator");
    } else {
      this.set("creator", Value.fromBytes(value as Bytes));
    }
  }

  get totalShares(): string | null {
    let value = this.get("totalShares");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set totalShares(value: string | null) {
    if (value === null) {
      this.unset("totalShares");
    } else {
      this.set("totalShares", Value.fromString(value as string));
    }
  }

  get createdAt(): string | null {
    let value = this.get("createdAt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set createdAt(value: string | null) {
    if (value === null) {
      this.unset("createdAt");
    } else {
      this.set("createdAt", Value.fromString(value as string));
    }
  }

  get adapters(): Array<string> {
    let value = this.get("adapters");
    return value.toStringArray();
  }

  set adapters(value: Array<string>) {
    this.set("adapters", Value.fromStringArray(value));
  }

  get extensions(): Array<string> {
    let value = this.get("extensions");
    return value.toStringArray();
  }

  set extensions(value: Array<string>) {
    this.set("extensions", Value.fromStringArray(value));
  }
}

export class Member extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Member entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Member entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Member", id.toString(), this);
  }

  static load(id: string): Member | null {
    return store.get("Member", id) as Member | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get memberAddress(): Bytes | null {
    let value = this.get("memberAddress");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set memberAddress(value: Bytes | null) {
    if (value === null) {
      this.unset("memberAddress");
    } else {
      this.set("memberAddress", Value.fromBytes(value as Bytes));
    }
  }

  get createdAt(): string | null {
    let value = this.get("createdAt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set createdAt(value: string | null) {
    if (value === null) {
      this.unset("createdAt");
    } else {
      this.set("createdAt", Value.fromString(value as string));
    }
  }

  get delegateKey(): Bytes | null {
    let value = this.get("delegateKey");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set delegateKey(value: Bytes | null) {
    if (value === null) {
      this.unset("delegateKey");
    } else {
      this.set("delegateKey", Value.fromBytes(value as Bytes));
    }
  }

  get shares(): BigInt {
    let value = this.get("shares");
    return value.toBigInt();
  }

  set shares(value: BigInt) {
    this.set("shares", Value.fromBigInt(value));
  }

  get loot(): BigInt {
    let value = this.get("loot");
    return value.toBigInt();
  }

  set loot(value: BigInt) {
    this.set("loot", Value.fromBigInt(value));
  }

  get lockedLoot(): BigInt {
    let value = this.get("lockedLoot");
    return value.toBigInt();
  }

  set lockedLoot(value: BigInt) {
    this.set("lockedLoot", Value.fromBigInt(value));
  }

  get tokenBalances(): Array<string> | null {
    let value = this.get("tokenBalances");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set tokenBalances(value: Array<string> | null) {
    if (value === null) {
      this.unset("tokenBalances");
    } else {
      this.set("tokenBalances", Value.fromStringArray(value as Array<string>));
    }
  }

  get proposals(): Array<string> | null {
    let value = this.get("proposals");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set proposals(value: Array<string> | null) {
    if (value === null) {
      this.unset("proposals");
    } else {
      this.set("proposals", Value.fromStringArray(value as Array<string>));
    }
  }

  get isDelegated(): boolean {
    let value = this.get("isDelegated");
    return value.toBoolean();
  }

  set isDelegated(value: boolean) {
    this.set("isDelegated", Value.fromBoolean(value));
  }

  get isJailed(): boolean {
    let value = this.get("isJailed");
    return value.toBoolean();
  }

  set isJailed(value: boolean) {
    this.set("isJailed", Value.fromBoolean(value));
  }

  get didFullyRagequit(): boolean {
    let value = this.get("didFullyRagequit");
    return value.toBoolean();
  }

  set didFullyRagequit(value: boolean) {
    this.set("didFullyRagequit", Value.fromBoolean(value));
  }
}

export class Proposal extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Proposal entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Proposal entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Proposal", id.toString(), this);
  }

  static load(id: string): Proposal | null {
    return store.get("Proposal", id) as Proposal | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get proposalId(): Bytes {
    let value = this.get("proposalId");
    return value.toBytes();
  }

  set proposalId(value: Bytes) {
    this.set("proposalId", Value.fromBytes(value));
  }

  get flags(): BigInt {
    let value = this.get("flags");
    return value.toBigInt();
  }

  set flags(value: BigInt) {
    this.set("flags", Value.fromBigInt(value));
  }

  get submittedBy(): Bytes | null {
    let value = this.get("submittedBy");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set submittedBy(value: Bytes | null) {
    if (value === null) {
      this.unset("submittedBy");
    } else {
      this.set("submittedBy", Value.fromBytes(value as Bytes));
    }
  }

  get sponsored(): boolean {
    let value = this.get("sponsored");
    return value.toBoolean();
  }

  set sponsored(value: boolean) {
    this.set("sponsored", Value.fromBoolean(value));
  }

  get sponsoredAt(): string | null {
    let value = this.get("sponsoredAt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set sponsoredAt(value: string | null) {
    if (value === null) {
      this.unset("sponsoredAt");
    } else {
      this.set("sponsoredAt", Value.fromString(value as string));
    }
  }

  get sponsoredBy(): Bytes | null {
    let value = this.get("sponsoredBy");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set sponsoredBy(value: Bytes | null) {
    if (value === null) {
      this.unset("sponsoredBy");
    } else {
      this.set("sponsoredBy", Value.fromBytes(value as Bytes));
    }
  }

  get processed(): boolean {
    let value = this.get("processed");
    return value.toBoolean();
  }

  set processed(value: boolean) {
    this.set("processed", Value.fromBoolean(value));
  }

  get processedAt(): string | null {
    let value = this.get("processedAt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set processedAt(value: string | null) {
    if (value === null) {
      this.unset("processedAt");
    } else {
      this.set("processedAt", Value.fromString(value as string));
    }
  }

  get processedBy(): Bytes | null {
    let value = this.get("processedBy");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set processedBy(value: Bytes | null) {
    if (value === null) {
      this.unset("processedBy");
    } else {
      this.set("processedBy", Value.fromBytes(value as Bytes));
    }
  }

  get member(): string | null {
    let value = this.get("member");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set member(value: string | null) {
    if (value === null) {
      this.unset("member");
    } else {
      this.set("member", Value.fromString(value as string));
    }
  }

  get tokenToMint(): Bytes | null {
    let value = this.get("tokenToMint");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set tokenToMint(value: Bytes | null) {
    if (value === null) {
      this.unset("tokenToMint");
    } else {
      this.set("tokenToMint", Value.fromBytes(value as Bytes));
    }
  }

  get amount(): BigInt | null {
    let value = this.get("amount");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set amount(value: BigInt | null) {
    if (value === null) {
      this.unset("amount");
    } else {
      this.set("amount", Value.fromBigInt(value as BigInt));
    }
  }

  get sharesRequested(): BigInt | null {
    let value = this.get("sharesRequested");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set sharesRequested(value: BigInt | null) {
    if (value === null) {
      this.unset("sharesRequested");
    } else {
      this.set("sharesRequested", Value.fromBigInt(value as BigInt));
    }
  }

  get token(): Bytes | null {
    let value = this.get("token");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set token(value: Bytes | null) {
    if (value === null) {
      this.unset("token");
    } else {
      this.set("token", Value.fromBytes(value as Bytes));
    }
  }

  get applicant(): Bytes | null {
    let value = this.get("applicant");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set applicant(value: Bytes | null) {
    if (value === null) {
      this.unset("applicant");
    } else {
      this.set("applicant", Value.fromBytes(value as Bytes));
    }
  }

  get proposer(): Bytes | null {
    let value = this.get("proposer");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set proposer(value: Bytes | null) {
    if (value === null) {
      this.unset("proposer");
    } else {
      this.set("proposer", Value.fromBytes(value as Bytes));
    }
  }

  get shareHolderAddr(): Bytes | null {
    let value = this.get("shareHolderAddr");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set shareHolderAddr(value: Bytes | null) {
    if (value === null) {
      this.unset("shareHolderAddr");
    } else {
      this.set("shareHolderAddr", Value.fromBytes(value as Bytes));
    }
  }

  get status(): string | null {
    let value = this.get("status");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set status(value: string | null) {
    if (value === null) {
      this.unset("status");
    } else {
      this.set("status", Value.fromString(value as string));
    }
  }

  get currentIndex(): BigInt | null {
    let value = this.get("currentIndex");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set currentIndex(value: BigInt | null) {
    if (value === null) {
      this.unset("currentIndex");
    } else {
      this.set("currentIndex", Value.fromBigInt(value as BigInt));
    }
  }

  get blockNumber(): BigInt | null {
    let value = this.get("blockNumber");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set blockNumber(value: BigInt | null) {
    if (value === null) {
      this.unset("blockNumber");
    } else {
      this.set("blockNumber", Value.fromBigInt(value as BigInt));
    }
  }

  get requestAmount(): BigInt | null {
    let value = this.get("requestAmount");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set requestAmount(value: BigInt | null) {
    if (value === null) {
      this.unset("requestAmount");
    } else {
      this.set("requestAmount", Value.fromBigInt(value as BigInt));
    }
  }

  get tributeAmount(): BigInt | null {
    let value = this.get("tributeAmount");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set tributeAmount(value: BigInt | null) {
    if (value === null) {
      this.unset("tributeAmount");
    } else {
      this.set("tributeAmount", Value.fromBigInt(value as BigInt));
    }
  }

  get ongoingKicks(): Bytes | null {
    let value = this.get("ongoingKicks");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set ongoingKicks(value: Bytes | null) {
    if (value === null) {
      this.unset("ongoingKicks");
    } else {
      this.set("ongoingKicks", Value.fromBytes(value as Bytes));
    }
  }

  get memberToKick(): Bytes | null {
    let value = this.get("memberToKick");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set memberToKick(value: Bytes | null) {
    if (value === null) {
      this.unset("memberToKick");
    } else {
      this.set("memberToKick", Value.fromBytes(value as Bytes));
    }
  }

  get tokensToBurn(): BigInt | null {
    let value = this.get("tokensToBurn");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set tokensToBurn(value: BigInt | null) {
    if (value === null) {
      this.unset("tokensToBurn");
    } else {
      this.set("tokensToBurn", Value.fromBigInt(value as BigInt));
    }
  }

  get details(): Bytes | null {
    let value = this.get("details");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set details(value: Bytes | null) {
    if (value === null) {
      this.unset("details");
    } else {
      this.set("details", Value.fromBytes(value as Bytes));
    }
  }

  get adapterId(): Bytes | null {
    let value = this.get("adapterId");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set adapterId(value: Bytes | null) {
    if (value === null) {
      this.unset("adapterId");
    } else {
      this.set("adapterId", Value.fromBytes(value as Bytes));
    }
  }

  get adapterAddress(): Bytes | null {
    let value = this.get("adapterAddress");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set adapterAddress(value: Bytes | null) {
    if (value === null) {
      this.unset("adapterAddress");
    } else {
      this.set("adapterAddress", Value.fromBytes(value as Bytes));
    }
  }

  get keys(): Array<Bytes> | null {
    let value = this.get("keys");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytesArray();
    }
  }

  set keys(value: Array<Bytes> | null) {
    if (value === null) {
      this.unset("keys");
    } else {
      this.set("keys", Value.fromBytesArray(value as Array<Bytes>));
    }
  }

  get values(): Array<BigInt> | null {
    let value = this.get("values");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigIntArray();
    }
  }

  set values(value: Array<BigInt> | null) {
    if (value === null) {
      this.unset("values");
    } else {
      this.set("values", Value.fromBigIntArray(value as Array<BigInt>));
    }
  }
}

export class Bank extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Bank entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Bank entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Bank", id.toString(), this);
  }

  static load(id: string): Bank | null {
    return store.get("Bank", id) as Bank | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get bankAddress(): Bytes | null {
    let value = this.get("bankAddress");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set bankAddress(value: Bytes | null) {
    if (value === null) {
      this.unset("bankAddress");
    } else {
      this.set("bankAddress", Value.fromBytes(value as Bytes));
    }
  }

  get daoAddress(): Bytes | null {
    let value = this.get("daoAddress");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set daoAddress(value: Bytes | null) {
    if (value === null) {
      this.unset("daoAddress");
    } else {
      this.set("daoAddress", Value.fromBytes(value as Bytes));
    }
  }

  get balance(): BigInt | null {
    let value = this.get("balance");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set balance(value: BigInt | null) {
    if (value === null) {
      this.unset("balance");
    } else {
      this.set("balance", Value.fromBigInt(value as BigInt));
    }
  }

  get createdAt(): string | null {
    let value = this.get("createdAt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set createdAt(value: string | null) {
    if (value === null) {
      this.unset("createdAt");
    } else {
      this.set("createdAt", Value.fromString(value as string));
    }
  }

  get totalShares(): BigInt | null {
    let value = this.get("totalShares");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalShares(value: BigInt | null) {
    if (value === null) {
      this.unset("totalShares");
    } else {
      this.set("totalShares", Value.fromBigInt(value as BigInt));
    }
  }

  get molochv3(): string | null {
    let value = this.get("molochv3");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set molochv3(value: string | null) {
    if (value === null) {
      this.unset("molochv3");
    } else {
      this.set("molochv3", Value.fromString(value as string));
    }
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Token entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Token entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Token", id.toString(), this);
  }

  static load(id: string): Token | null {
    return store.get("Token", id) as Token | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokenAddress(): Bytes {
    let value = this.get("tokenAddress");
    return value.toBytes();
  }

  set tokenAddress(value: Bytes) {
    this.set("tokenAddress", Value.fromBytes(value));
  }

  get balance(): BigInt | null {
    let value = this.get("balance");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set balance(value: BigInt | null) {
    if (value === null) {
      this.unset("balance");
    } else {
      this.set("balance", Value.fromBigInt(value as BigInt));
    }
  }
}

export class TokenBalance extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save TokenBalance entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save TokenBalance entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("TokenBalance", id.toString(), this);
  }

  static load(id: string): TokenBalance | null {
    return store.get("TokenBalance", id) as TokenBalance | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get tokenBalance(): BigInt {
    let value = this.get("tokenBalance");
    return value.toBigInt();
  }

  set tokenBalance(value: BigInt) {
    this.set("tokenBalance", Value.fromBigInt(value));
  }

  get member(): string | null {
    let value = this.get("member");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set member(value: string | null) {
    if (value === null) {
      this.unset("member");
    } else {
      this.set("member", Value.fromString(value as string));
    }
  }
}

export class Adapter extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Adapter entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Adapter entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Adapter", id.toString(), this);
  }

  static load(id: string): Adapter | null {
    return store.get("Adapter", id) as Adapter | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get adapterId(): Bytes {
    let value = this.get("adapterId");
    return value.toBytes();
  }

  set adapterId(value: Bytes) {
    this.set("adapterId", Value.fromBytes(value));
  }

  get adapterAddress(): Bytes {
    let value = this.get("adapterAddress");
    return value.toBytes();
  }

  set adapterAddress(value: Bytes) {
    this.set("adapterAddress", Value.fromBytes(value));
  }

  get acl(): BigInt {
    let value = this.get("acl");
    return value.toBigInt();
  }

  set acl(value: BigInt) {
    this.set("acl", Value.fromBigInt(value));
  }

  get molochv3(): string | null {
    let value = this.get("molochv3");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set molochv3(value: string | null) {
    if (value === null) {
      this.unset("molochv3");
    } else {
      this.set("molochv3", Value.fromString(value as string));
    }
  }
}

export class Extension extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Extension entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Extension entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Extension", id.toString(), this);
  }

  static load(id: string): Extension | null {
    return store.get("Extension", id) as Extension | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get extensionAddress(): Bytes {
    let value = this.get("extensionAddress");
    return value.toBytes();
  }

  set extensionAddress(value: Bytes) {
    this.set("extensionAddress", Value.fromBytes(value));
  }

  get extensionId(): Bytes {
    let value = this.get("extensionId");
    return value.toBytes();
  }

  set extensionId(value: Bytes) {
    this.set("extensionId", Value.fromBytes(value));
  }

  get molochv3(): string | null {
    let value = this.get("molochv3");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set molochv3(value: string | null) {
    if (value === null) {
      this.unset("molochv3");
    } else {
      this.set("molochv3", Value.fromString(value as string));
    }
  }
}
