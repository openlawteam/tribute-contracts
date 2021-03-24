import { DaoRegistry as DaoRegistryTemplate } from "../generated/templates";
import { DaoRegistry } from "../generated/templates/DaoRegistry/DaoRegistry";
import { BankExtension } from "../generated/templates/BankExtension/BankExtension";
import { DAOCreated } from "../generated/DaoFactory/DaoFactory";
import { TributeDao, Member } from "../generated/schema";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  LOCKED_LOOT,
  LOOT,
  SHARES,
  BANK_EXTENSION_ID,
} from "./helpers/constants";

function loadOrCreateDao(daoAddress: string): TributeDao {
  let dao = TributeDao.load(daoAddress);
  if (dao == null) {
    dao = new TributeDao(daoAddress);
  }
  return dao as TributeDao;
}

function loadOrCreateMember(
  memberAddress: Address,
  daoAddress: Address
): Member {
  let member = Member.load(memberAddress.toHexString());

  if (member == null) {
    member = new Member(memberAddress.toHex());
    // member.createdAt = createdAt;
    member.memberAddress = memberAddress;
    member.delegateKey = memberAddress;
    member.isDelegated = false;
    member.isJailed = false;

    // create 1-1 relationship between member and dao
    let tributes: string[] = [];
    tributes.push(daoAddress.toHexString());

    member.tributedaos = tributes;
  } else {
    // get members daos
    let tributes: string[] = member.tributedaos;

    tributes.push(daoAddress.toHexString());
    member.tributedaos = tributes;

    // let alreadyExists = false;

    // for (let i = 0; i < tributes.length; i++) {
    //   if (tributes[i].daoAddress === daoAddress.toHexString()) {
    //     alreadyExists = true;
    //     break;
    //   }
    // }

    // if (alreadyExists === false) {
    //   // add the member to the dao
    //   tributes.push(daoAddress.toHexString());
    //   member.tributes = tributes;
    // }
  }

  /**
   * get `balanceOf`
   */
  // let registry = DaoRegistry.bind(daoAddress);
  // let bankContractAddress = registry.getExtensionAddress(
  //   ByteArray.fromHexString(BANK_EXTENSION_ID)
  //   // BANK_EXTENSION_ID.toString() as Bytes
  // );

  // let bankRegistry = BankExtension.bind(bankContractAddress);

  // @todo TEMP SET TO ZERO

  // get balanceOf member shares
  // comes from the
  // let balanceOfSHARES = bankRegistry.balanceOf(memberAddress, SHARES);
  member.shares = BigInt.fromI32(0); //balanceOfSHARES;

  // get balanceOf member loot
  // let balanceOfLOOT = bankRegistry.balanceOf(memberAddress, LOOT);
  member.loot = BigInt.fromI32(0); // balanceOfLOOT;

  // get balanceOf member locked loot
  // let balanceOfLOCKED_LOOT = bankRegistry.balanceOf(memberAddress, LOCKED_LOOT);
  member.lockedLoot = BigInt.fromI32(0); // balanceOfLOCKED_LOOT;

  return member as Member;
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

  DaoRegistryTemplate.create(event.params._address);

  let member = loadOrCreateMember(
    event.transaction.from,
    event.params._address
  );

  dao.save();

  member.createdAt = event.block.timestamp.toString();
  member.save();
}
