import { Address } from "@graphprotocol/graph-ts";

// Reserved Internal Addresses
export let UNITS: Address = Address.fromString(
  "0x00000000000000000000000000000000000Ff1CE"
);
export let GUILD: Address = Address.fromString(
  "0x000000000000000000000000000000000000dead"
);
export let TOTAL: Address = Address.fromString(
  "0x000000000000000000000000000000000000babe"
);
export let MEMBER_COUNT: Address = Address.fromString(
  "0x00000000000000000000000000000000decafbad"
);
export let ESCROW: Address = Address.fromString(
  "0x0000000000000000000000000000000000004bec"
);

// adapter/extension names hashed (lowercase)

/**
 * Adapters
 */

export let DISTRIBUTE_ID: string =
  "0x67f5ee3ea5f89bb62c6dbf9e6a46fac86b15fc7c224cb0f88a13f89aeded9e1f";

export let FINANCING_ID: string =
  "0x903b70ab7c13e94d5db58ae5205461e75e7c006ddff7cb26a3d9c1b246a62a5f";

export let GUILDKICK_ID: string =
  "0x33c50675c08bf6495444473b20b4c359e484c6bf5c6999f6256e86bf7bb08b2b";

export let TRIBUTE_ID: string =
  "0x9f3f3b08778f7e67091ae6263e03332fca03c910449d2c2eec3320e107a90ad6";

export let TRIBUTE_NFT_ID: string =
  "0x5cdd394d9967cda884ceb725728ffb6d8963934b8aef7dfb14a58f3e9eea6a3a";

export let ONBOARDING_ID: string =
  "0x68c24fc24acf5b51ccf67c01fea706e9e0e110825d4f88d07623f64f32f55d89";

export let MANAGING_ID: string =
  "0xb5d1b10526b91c1951e75295138b32c80917c8ba0b96f19926ef2008a82b6511";

export let VOTING_ID: string =
  "0x0e49311626a26ba5be58a3b13d239908e80ce0dffdd5c50bf1d9c82ff35d1ab3";

/**
 * Extensions
 */

export let BANK_EXTENSION_ID: string =
  "0xea0ca03c7adbe41dc655fec28a9209dc8e6e042f3d991a67765ba285b9cf73a0";

export let ERC20_EXTENSION_ID: string =
  "0x77d63af07d7aad7f422b79cf9d7285aec3f3e6f32e6e4391f1ce842d752663fd";

export let NFT_EXTENSION_ID: string =
  "0x7dd481eb4b63b94bb55e6b98aabb06c3b8484f82a4d656d6bca0b0cf9b446be0";
