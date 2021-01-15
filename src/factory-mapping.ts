import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { Adapter, Laoland } from "../generated/schema";
// import { Bytes, store } from "@graphprotocol/graph-ts";

export function handleDaoCreated(event: DAOCreated): void {
  const laolandId = event.params._address.toHex();
  let laoland = Laoland.load(laolandId);

  if (laoland == null) {
    laoland = new Laoland(laolandId);
  }

  laoland.laoland = event.params._address;
  laoland.name = event.params._name;

  laoland.save();
}
