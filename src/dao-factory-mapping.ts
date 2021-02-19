import { DaoRegistry } from "../generated/templates";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { DaoConstants, Laoland } from "../generated/schema";
import {
  ETH_TOKEN,
  GUILD,
  LOCKED_LOOT,
  LOOT,
  SHARES,
  TOTAL,
  VOTING_CONTRACT_ADDRESS,
} from "./dao-constants";
import { log } from "@graphprotocol/graph-ts";

// helper
function loadOrCreateDao(address: string): Laoland {
  let dao = Laoland.load(address);
  if (dao == null) {
    dao = new Laoland(address);
  }
  return dao as Laoland;
}

function loadOrCreateDaoConstants(address: string): DaoConstants {
  let daoConstants = DaoConstants.load(address);
  if (daoConstants == null) {
    daoConstants = new DaoConstants(address);

    // create 1-to-1 relationship between the dao and its bank and constants
    daoConstants.laoland = address;

    // constants
    daoConstants.GUILD = GUILD;
    daoConstants.TOTAL = TOTAL;
    daoConstants.SHARES = SHARES;
    daoConstants.LOOT = LOOT;
    daoConstants.LOCKED_LOOT = LOCKED_LOOT;
    daoConstants.ETH_TOKEN = ETH_TOKEN;
  }

  return daoConstants as DaoConstants;
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

  // load or create dao constants and save
  let daoConstants = loadOrCreateDaoConstants(event.address.toHexString());

  // load or create dao and save
  let dao = loadOrCreateDao(event.params._address.toHexString());

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params._address;
  dao.initialized = true;
  dao.name = event.params._name;

  // create 1-to-1 relationship between the dao and its bank and constants
  dao.bank = event.params._address.toHexString();
  dao.daoConstants = event.params._address.toHexString();

  DaoRegistry.create(event.params._address);

  dao.save();
  daoConstants.save();
}
