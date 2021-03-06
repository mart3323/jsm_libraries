const proxify = (target, schema) => {
  if (!schema) return target
  return new Proxy(target, {
    get(target, p) {
      if (schema[p] && schema[p].apply) {
        return (...args) => schema[p](target,p,args)
      } else if (schema[p]) {
        return (...args) => proxify(target[p](...args), schema[p])
      } else {
        return target[p]
      }
    }
  })
}
const isNativeFunction = (value) => (typeof value === 'function') && !Java.isJavaObject(value)
const isJavaFunction = (value) => (typeof value === 'function') && Java.isJavaObject(value)

module.exports = {
  proxify,
  isJavaFunction,
  isNativeFunction
}
