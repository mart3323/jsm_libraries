const {proxify} = require("./utils.js");

/**
 * Unregister huds when the service stops or has an error
 * (if the service is stopped or has an error)
 */
unregister = []
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
const cleanup = JavaWrapper.methodToJava(() => {
  unregister.forEach(fn => fn())
});
event.stopListener = cleanup
module.exports = cleanup
