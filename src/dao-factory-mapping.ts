import { DaoRegistry } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Molochv3 } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

function loadOrCreateDao(address: string): Molochv3 {
  let dao = Molochv3.load(address);
  if (dao == null) {
    dao = new Molochv3(address);
  }
  return dao as Molochv3;
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
    "================ handleDaoCreated event fired. daoAddress: {}, daoName: {}",
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
