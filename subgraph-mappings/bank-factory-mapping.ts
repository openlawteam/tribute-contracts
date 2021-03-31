import { BankCreated } from "../generated/BankFactory/BankFactory";
import { BankExtension as BankExtensionTemplate } from "../generated/templates";
import { log } from "@graphprotocol/graph-ts";

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

  BankExtensionTemplate.create(event.params.bankAddress);
}
