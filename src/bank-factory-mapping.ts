import { BankExtension } from "../generated/templates";
import { BankCreated } from "../generated/BankFactory/BankFactory";
import { Bank } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

// helper
function loadOrCreateBank(address: string): Bank {
  let bank = Bank.load(address);
  if (bank == null) {
    bank = new Bank(address);
  }
  return bank as Bank;
}

/**
 * handleBankCreated
 *
 * @param event BankCreated
 * Start indexing the bank;
 * `event.params.bankAddress` is the address of the new bank contract
 *
 *  BankExtension.create(event.params.bankAddress);
 */
export function handleBankCreated(event: BankCreated): void {
  log.info("================ BankCreated event fired. bankAddress: {}, {}", [
    event.params.bankAddress.toHexString(),
    event.address.toHexString(),
  ]);
  // let daoAddress = event.address;
  let bankAddress = event.params.bankAddress;

  let bank = loadOrCreateBank(bankAddress.toHexString());

  bank.createdAt = event.block.timestamp.toString();
  bank.bankAddress = bankAddress;
  bank.balance = BigInt.fromI32(0);

  // create 1-to-1 relationship between the bank and its dao
  bank.molochv3 = event.params.bankAddress.toHexString();

  BankExtension.create(event.params.bankAddress);

  bank.save();
}
