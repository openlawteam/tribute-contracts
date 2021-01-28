import { DaoRegistry } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Laoland } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

// helper
function loadOrCreateDao(address: string): Laoland {
  let dao = Laoland.load(address);
  if (dao == null) {
    dao = new Laoland(address);
  }
  return dao as Laoland;
}

/**
 * handleDaoCreated
 *
 * @param event DAOCreated
 * Start indexing the dao; `event.params._address` is the
 * address of the new dao contract
 *
 *  BankExtension.create(event.params._address);
 *  DaoRegistry.create(event.params._address);
 */
export function handleDaoCreated(event: DAOCreated): void {
  log.info(
    "**************** handleDaoCreated event fired. daoAddress: {}, daoName: {}",
    [event.params._address.toHexString(), event.params._name.toString()]
  );

  let dao = loadOrCreateDao(event.params._address.toHexString());

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params._address;
  dao.initialized = true;
  dao.name = event.params._name;

  // create 1-to-1 relationship between the dao and its bank
  dao.bank = event.params._address.toHexString();

  DaoRegistry.create(event.params._address);

  dao.save();
}
