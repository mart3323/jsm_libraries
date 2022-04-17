const INVALID = Symbol('INVALID')
const nbtToJson = (nbt) => {
  if (nbt.isCompound()) {
    return Object.fromEntries(
      Array.from(nbt.getKeys())
        .map(key => [key, nbtToJson(nbt.get(key))])
    )
  }
  if (nbt.isList()) {
    return Array(nbt.length()).fill(0).map((z,i) => nbtToJson(nbt.get(i)))
  }
  if (nbt.isString()) return nbt.asString()
  if (nbt.isNumber()) return nbt.asNumber()
  if (nbt.isNull()) return null;
  return INVALID;
}
module.exports = nbtToJson
