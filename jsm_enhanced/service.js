const {isJavaFunction, isNativeFunction, proxify} = require("./utils.js");
let extra = () => {}
const unregister = [
  () => extra(),
]

// region Auto-unregister for huds
Hud = proxify(Hud, {
  createDraw2D: {
    register: (obj, p, args) => {
      obj[p](...args);
      unregister.push(() => obj.unregister())
    }
  },
  createDraw3D: {
    register: (obj, p, args) => {
      obj[p](...args);
      unregister.push(() => obj.unregister())
    }
  }
})
// endregion

// region Auto-unregister for commands
const proxifyCommandBuilder = (obj, name) => new Proxy(obj, {
  get(target, p, receiver) {
    if (p === 'register') {
      return (...args) => {
        unregister.push(() => Chat.unregisterCommand(name))
        return target[p](...args);
      }
    } else {
      return (...args) => proxifyCommandBuilder(target[p](...args), name)
    }
  }
})
Chat = proxify(Chat, {
  createCommandBuilder: (obj,p,args) => proxifyCommandBuilder(obj[p](...args), args[0])
})
// endregion

const toNativeFn = (fnOrMethodWrapper) => {
  if (isNativeFunction(fnOrMethodWrapper)) return fnOrMethodWrapper;
  if (isJavaFunction(fnOrMethodWrapper)) return () => fnOrMethodWrapper.run();
  throw new Error(`Value ${fnOrMethodWrapper} is not a function or methodWrapper`)
}

const cleanup = JavaWrapper.methodToJava(() => {
  unregister.forEach(fn => fn())
});
event.stopListener = cleanup
event = new Proxy(event, {
  get: (target, p, receiver) => {
    if (p === 'stopListener')
      return cleanup
    return target[p]
  },
  set: (target, p, value, receiver) => {
    if (p === 'stopListener') {
      return Object.assign(target, p, toNativeFn(value))
    } else {
      return Object.assign(target, p, value)
    }
  }
});
const addStopListener = (l) => unregister.push(toNativeFn(l))
module.exports = {
  cleanup,
  addStopListener
}
