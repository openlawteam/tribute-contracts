import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Laoland } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

function loadOrCreateDao(address: string): Laoland {
  let dao = Laoland.load(address);
  if (dao == null) {
    dao = new Laoland(address);
  }
  return dao as Laoland;
}

export function handleDaoCreated(event: DAOCreated): void {
  //don't index factory as dao
  if (event.params._address.toHexString()) {
    let laoland = loadOrCreateDao(event.params._address.toHexString());

    laoland.daoAddress = event.params._address;
    laoland.name = event.params._name;
    laoland.createdAt = event.block.timestamp.toString();
    laoland.initialized = true;

    log.info("**************** handleDaoCreated event fired. daoAddress: {}", [
      event.params._address.toHexString(),
    ]);

    laoland.save();
  }
}
