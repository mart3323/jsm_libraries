const {proxify} = require("./utils.js");


/*
  Concurrency-friendly waitTick() replacement
*/
/** Local tick counter */
let tickRel = 0
/** Map of tick offsets to functions that need to be called at that offset */
const tickMap = {}

JsMacros.on('Tick', JavaWrapper.methodToJava(() => {
  // Count up by one every tick
  tickRel += 1; 
  // If the current offset has functions to call, call them all
  if (tickMap[tickRel]) {
    tickMap[tickRel].forEach(fn => {
      fn()
    })
  }
  // Now that we're past the offset, delete the callbacks if there were any
  delete tickMap[tickRel]

  // Reset the counter to 0 when nothing is pending because why not
  if (Object.keys(tickMap).length === 0) {
    tickRel = 0;
  }
}))

// Actual implementation called by the user - just returns a promise and adds the resolve function to the tickmap to be called n ticks in the future
const waitTick = (n = 1) => new Promise(async res => {
  if (tickMap[tickRel + n]) {
    tickMap[tickRel + n].push(res)
  } else {
    tickMap[tickRel + n] = [res]
  }
});



/*
  Concurrency-friendly sleep() replacement
*/
const JSMTime = Time;
/**
 * Maximum sleep time - new tasks added to sleep may have to wait up to this long if there is a longer sleep currently scheduled
 * Setting this higher will increase the performance cost
 * Setting this lower will decrease the accuracy
 */
const RESOLUTION = 10;
const yieldExecution = () => new Promise(res =>
  JavaWrapper.methodToJavaAsync(res).run()
)

// Similar to tickMap - map of ms offsets into functions that need to be called at that offset
const sleepMap = {}
let runningSleep = false

const sleep = (n) => new Promise(async res => {
  const targetTime = JSMTime.time()+n;
  if (!sleepMap[targetTime]) {
    sleepMap[targetTime] = []
  }
  sleepMap[targetTime].push(res)

  // Since this one is implemented with blocking, we need to ensure only one copy runs
  if (runningSleep) return
  runningSleep = true

  while (Object.keys(sleepMap).length) {
    // Take the smallest currently remaining delay
    const [next] = Object.keys(sleepMap).map(Number).sort()
    const now = JSMTime.time();
    const delta = next - now;
    if (delta < 0) {
      // If we're already past the intended time, call the functions immediately
      sleepMap[next].forEach(fn => fn())
      delete sleepMap[next]
    } else if (delta < RESOLUTION) {
      // If we're close to the intended time, sleep until that time and then call the functions immediately
      JSMTime.sleep(delta);
      sleepMap[next].forEach(fn => fn())
      delete sleepMap[next]
    } else {
      // Else sleep for RESOLUTION and recheck the map in case other sleeps have been added in the meantime
      JSMTime.sleep(RESOLUTION)
    }
    // Allow events / waitTIck a chance to run - this happens at least every RESOLUTION ms
    await yieldExecution()
  }
  // Once there is nothing to wait for we can stop this loop
  runningSleep = false
});


Client = proxify(Client, {
  waitTick: () => {
    throw new Error('Client.waitTick does not support concurrency - please use the waitTick method from async() instead')
  }
})
Time = proxify(Time, {
  sleep: () => {
    throw new Error('Time.sleep does not support concurrency - please use the sleep method from async() instead')
  }
})

module.exports = {
  waitTick,
  sleep
}
