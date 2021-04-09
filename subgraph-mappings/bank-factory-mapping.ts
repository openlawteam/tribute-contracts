import { BankExtension as BankExtensionTemplate } from "../generated/templates";
import { BankCreated } from "../generated/BankFactory/BankFactory";
import { Bank } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

function loadOrCreateBank(bankAddress: string): Bank {
  let bank = Bank.load(bankAddress);
  if (bank == null) {
    bank = new Bank(bankAddress);
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
  log.info("================ BankCreated event fired. bankAddress: {}", [
    event.params.bankAddress.toHexString(),
  ]);

  // load or create bank and save
  let bank = loadOrCreateBank(event.params.bankAddress.toHexString());

  bank.tributeDao = event.address.toHex();
  bank.save();

  BankExtensionTemplate.create(event.params.bankAddress);
}
