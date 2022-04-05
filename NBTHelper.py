from typing import Union
if __name__ == "": from JsMacrosAC import *

def parseNBT(nbt):
    # type: (NBTElementHelper) -> Union[dict,list,None,str,float]
    if nbt.isNull(): return None
    if nbt.isNumber(): return nbt.asNumberHelper().asNumber()
    if nbt.isString(): return nbt.asString()
    if nbt.isList():
        lh = nbt.asListHelper()
        return [parseNBT(lh.get(n)) for n in range(lh.length())]
    if nbt.isCompound():
        c = nbt.asCompoundHelper()
        return {k:parseNBT(c.get(k)) for k in c.getKeys()}
    raise TypeError('Passed argument is not an NBTHelper')


nbt = parseNBT(Player.getPlayer().getNBT())
for attr in nbt['Attributes']:
    Chat.log(attr['Name'])
