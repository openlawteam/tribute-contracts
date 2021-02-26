import { DaoRegistry } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Molochv3 } from "../generated/schema";
// import {
//   ETH_TOKEN,
//   GUILD,
//   LOCKED_LOOT,
//   LOOT,
//   SHARES,
//   TOTAL,
// } from "./dao-constants";
import { log } from "@graphprotocol/graph-ts";

// helper
function loadOrCreateDao(address: string): Molochv3 {
  let dao = Molochv3.load(address);
  if (dao == null) {
    dao = new Molochv3(address);
  }
  return dao as Molochv3;
}

// function loadOrCreateDaoConstants(address: string): DaoConstants {
//   let daoConstants = DaoConstants.load(address);

//   if (daoConstants == null) {
//     log.info(
//       "**************** loadOrCreateDaoConstants function. daoAddress: {}",
//       [address.toString()]
//     );

//     daoConstants = new DaoConstants(address);

//     // create 1-to-1 relationship between the dao and its bank and constants
//     // daoConstants.molochv3 = address;

//     // constants
//     daoConstants.GUILD = GUILD;
//     daoConstants.TOTAL = TOTAL;
//     daoConstants.SHARES = SHARES;
//     daoConstants.LOOT = LOOT;
//     daoConstants.LOCKED_LOOT = LOCKED_LOOT;
//     daoConstants.ETH_TOKEN = ETH_TOKEN;
//   }

//   return daoConstants as DaoConstants;
// }

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

  // load or create dao constants and save
  // let daoConstants = loadOrCreateDaoConstants(
  //   event.params._address.toHexString()
  // );

  // load or create dao and save
  let dao = loadOrCreateDao(event.params._address.toHexString());

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params._address;
  // dao.initialized = true;
  dao.name = event.params._name;
  dao.creator = event.transaction.from;

  // create 1-to-1 relationship between the dao and its;
  // - bank
  // - constants
  // dao.bank = event.params._address.toHexString();
  // dao.daoConstants = event.params._address.toHexString();

  DaoRegistry.create(event.params._address);

  dao.save();
  // daoConstants.save();
}
