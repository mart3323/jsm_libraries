
const isNativeFunction = (value) => (typeof value === 'function') && !Java.isJavaObject(value)
const isJavaFunction = (value) => (typeof value === 'function') && Java.isJavaObject(value)
const autoWrapIfFunction = (value) =>
  isNativeFunction(value)
    ? JavaWrapper.methodToJava(value)
    : value

const proxify = (target) => {
  if (typeof target !== 'object') return target
  return new Proxy(target, {
    get(target, p) {
      if (isJavaFunction(target[p])) {
        return (...args) => proxify(target[p](...args.map(autoWrapIfFunction)))
      } else {
        return proxify(target[p])
      }
    }
  })
}
Chat = proxify(Chat)
Client = proxify(Client)
FS = proxify(FS)
GlobalVars = proxify(GlobalVars)
Hud = proxify(Hud)
// JavaWrapper = proxify(JavaWrapper)
JsMacros = proxify(JsMacros)
KeyBind = proxify(KeyBind)
Player = proxify(Player)
PositionCommon = proxify(PositionCommon)
Reflection = proxify(Reflection)
Request = proxify(Request)
Time = proxify(Time)
World = proxify(World)
