const cleanup = require('./service.js')
require('./autoWrap.js');

module.exports = {
  /** @type {jsm_enhanced.Async} */
  async: () => require('./async.js'),

  /** @type {jsm_enhanced.Stop} */
  stop: () => {
    // For services, cleanup is performed on close anyway
    // For other events run the cleanup manually here
    if (event.getEventName() !== 'Service')
      cleanup.run();
    // Close HUDs and anything else not tied to context
    event.stopListener.run();
    // Close the context
    const ctx = context.getCtx();
    ctx.releaseBoundEventIfPresent()
    ctx.closeContext()
  }
}
