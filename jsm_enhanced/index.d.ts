

declare module jsm_enhanced {
  /**
   * Opt-in timing function replacements
   *
   * When called, will remove Client.waitTick and Time.sleep, and returns replacement methods for each
   *
   * These replacement methods return Promises that can be awaited without blocking the thread
   * (or in the case of sleep, blocking the thread in small chunks, allowing interruptions every 10ms)
   *
   * @example
   * const async = require('./libs/jsm_enhanced/index.js').async()
   *
   * async.waitTick(10).then(() => Chat.log('500ms')) // logs in 500 ms
   * async.waitTick(2).then(() => Chat.log('100ms')) // logs in 100 ms (not in 600)
   * async.sleep(123).then(() => Chat.log('123ms')) // logs in 123 ms (not in 723)
   *
   * // The familiar blocking behaviour can always be emulated with async await
   * async function main(number) {
   *   Chat.log(`Task ${number} started`)
   *   await async.waitTick(10)
   *   Chat.log(`Task ${number} 500ms done`)
   *   await async.sleep(123)
   *   Chat.log(`Task ${number} 623ms done and finished`)
   * }
   *
   * // But now you can run multiple of them in parallel while still handling incoming events
   * JsMacros.on('RecvMessage', JavaWrapper.methodToJava(() => {Chat.log(`hey it's a message`)})
   * main()
   * async.waitTick(2).then(main)
   */
  type Async = () => {
    sleep: (ms:number) => Promise<void>,
    waitTick: (ticks:number=1) => Promise<void>
  }
  /**
   * Stops the current script's context, removing any event listeners and Draw2Ds/Draw3Ds
   * After calling this, no other code will run
   *
   * NB: This depends on the Hud library being replaced with a proxy, so jsm_enhanced must be imported *first*
   *
   * @example
   * // OK
   * const { stop } = require('./libs/jsm_enhanced/index.js')
   *
   * const draw2d = Hud.createDraw2D()
   * draw2d.register()
   * // ...
   * stop()
   * Chat.log('This will not run')
   *
   *
   * // not OK
   * const draw2d = Hud.createDraw2D()
   *
   * const { stop } = require('./libs/jsm_enhanced/index.js'/
   * draw2d.register()
   * // ...
   * stop()
   * Chat.log('This will not run')
   */
  type Stop = () => never

  /**
   * Add a stop listener.
   * In services, this is similar to assigning to event.stopListener, except subsequent listeners do not overwrite previous ones
   * In scripts, this only affects cleanup if the script is stopped via {@link Stop}
   */
  type addStopListener = (listener: () => void) => void
}
