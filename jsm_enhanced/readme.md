# JSM enhanced
Quality of life improvements to the JSM API

## Automatically included features
* Automatic cleanup on service stop
  * ~~of event handlers~~ (Implemented in jsmacros)
  * of Draw2Ds and Draw3Ds
  * of registered custom commands
* Automatic wrapping of any functions passed to JSM with `JavaWrapper.methodToJava`

## Opt-in features

### Cleanup for non-services
Provides the same cleanup as for services (listed above), but can be called manually in any type of script
```ts
const jsmEnhanced = require('/libs/jsm_enhanced/index.js')

// Draw2d
const d2d = Hud.createDraw2D()
d2d.addText('This will be removed', 100, 100, 0xff0000, false)
d2d.register()

// event listener
JsMacros.on('Tick', (e) => {Chat.log('This will never appear')})

// Command
Chat.createCommandBuilder('test').registerCommand()

// The stop command will remove them all
jsmEnhanced.stop();

// As well as stop the script itself
Chat.log('This will never appear')

```
### Async  
Promise-based replacements for `Time.sleep`, `Client.waitTick`, and `JsMacros.waitForEvent` allowing the use of true JS concurrency
```ts
const jsmEnhanced = require('libs/jsm_enhanced/index.js')
const { waitTick, sleep, waitForEvent } = jsmEnhanced.async() 

const fastLoop = async () => {
  const d2d = Hud.createDraw2D();
  d2d.register()
  const text = d2d.addText('---',0,0,0x00ff00,false);
  while (text.y < 100) {
    await sleep(10);
    text.y += 1
  }
}
const slowLoop = async () => {
  const d2d = Hud.createDraw2D();
  d2d.register()
  const text = d2d.addText('---',30,0,0xff0000,false);
  while (text.y < 100) {
    await waitTick(1)
    text.y += 5
  }
}

const main = async () => {
  fastLoop()
  slowLoop()
  waitTick(5).then(fastLoop)
  waitTick(5).then(slowLoop)
  Chat.log('Running animations - drop slot 2 to cancel')
  await waitForEvent('DropSlot', e => e.slot === 2)
  jsmEnhanced.stop()
}
main()

```
