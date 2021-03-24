import { DaoRegistry } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Tribute } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

function loadOrCreateDao(address: string): Tribute {
  let dao = Tribute.load(address);
  if (dao == null) {
    dao = new Tribute(address);
  }
  return dao as Tribute;
}

/**
 * handleDaoCreated
 *
 * @param event DAOCreated
 * Start indexing the dao; `event.params._address` is the
 * address of the newly created dao.
 */
export function handleDaoCreated(event: DAOCreated): void {
  log.info(
    "================ DAOCreated event fired. daoAddress: {}, daoName: {}",
    [event.params._address.toHexString(), event.params._name.toString()]
  );

  // load or create dao and save
  let dao = loadOrCreateDao(event.params._address.toHexString());

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params._address;
  dao.name = event.params._name;
  dao.creator = event.transaction.from;
  dao.totalShares = BigInt.fromI32(0).toString();

  DaoRegistry.create(event.params._address);

  dao.save();
}
