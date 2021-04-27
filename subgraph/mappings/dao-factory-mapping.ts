import { BigInt, log } from "@graphprotocol/graph-ts";

import { DaoRegistry as DaoRegistryTemplate } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { TributeDao } from "../generated/schema";

function loadOrCreateDao(daoAddress: string): TributeDao {
  let dao = TributeDao.load(daoAddress);
  if (dao == null) {
    dao = new TributeDao(daoAddress);
  }
  return dao as TributeDao;
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
  dao.totalUnits = BigInt.fromI32(0).toString();
  dao.save();

  DaoRegistryTemplate.create(event.params._address);
}
