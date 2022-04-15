const {proxify} = require("./utils.js");

unregister = []

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

const cleanup = JavaWrapper.methodToJava(() => {
  unregister.forEach(fn => fn())
});
event.stopListener = cleanup
module.exports = cleanup
