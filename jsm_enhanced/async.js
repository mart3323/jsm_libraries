const {proxify} = require("./utils.js");


/*
  Concurrency-friendly waitTick() replacement
*/
let tickRel = 0
const tickMap = {}

JsMacros.on('Tick', JavaWrapper.methodToJava(() => {
  tickRel += 1;
  if (tickMap[tickRel]) {
    tickMap[tickRel].forEach(fn => {
      fn()
    })
  }
  delete tickMap[tickRel]

  if (Object.keys(tickMap).length === 0) {
    tickRel = 0;
  }
}))
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
const sleepMap = {}
let runningSleep = false

const sleep = (n) => new Promise(async res => {
  const targetTime = JSMTime.time()+n;
  if (!sleepMap[targetTime]) {
    sleepMap[targetTime] = []
  }
  sleepMap[targetTime].push(res)

  if (runningSleep) return
  runningSleep = true

  while (Object.keys(sleepMap).length) {
    const [next] = Object.keys(sleepMap).map(Number).sort()
    const now = JSMTime.time();
    const delta = next - now;
    if (delta < 0) {
      sleepMap[next].forEach(fn => fn())
      delete sleepMap[next]
    } else if (delta < RESOLUTION) {
      JSMTime.sleep(delta);
      sleepMap[next].forEach(fn => fn())
      delete sleepMap[next]
    } else {
      JSMTime.sleep(RESOLUTION)
    }
    await yieldExecution()
  }

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
