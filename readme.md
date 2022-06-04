# Collection of various JsMacros libraries

## JSM_Enhanced
![Language: Javascript](https://img.shields.io/badge/Language-Javascript-yellow?logo=javascript&logoColor=yellow)

Various quality-of-life upgrades to the JSM API.  
See [JSM enhanced readme](./jsm_enhanced/readme.md)

## NBTHelper
Convert an NBTHelper into a native object for easier usage

<table>
<tbody>
<tr>
<td>

![Language: Javascript](https://img.shields.io/badge/Language-Javascript-yellow?logo=javascript&logoColor=yellow)
```ts
const { parseNBT } = require('libs/NBTHelper/index.js')

const nbt = parseNBT(Player.getPlayer().getNBT())
const attributes = nbt.Attributes.map(attr => attr.Name)
```

</td>
<td>

![Language: JEP (python3.9)](https://img.shields.io/badge/Language-JEP%20(python3.9)-brightgreen?logo=python&logoColor=green)
```py
from libs.NBTHelper import parseNBT

nbt = parseNBT(Player.getPlayer().getNBT())
attributes = [attr['Name'] for attr in nbt['Attributes']]
```

</td>
</tr>
</tbody>
</table>


## Geode analyser
Analyses a geode for building a flying-machine farm - returns info about which crystals are accessible from which axis
and renders a build guide

![Language: Javascript](https://img.shields.io/badge/Language-Javascript-yellow?logo=javascript&logoColor=yellow)
```ts
const { scanGeode } = require('...')
const geode = scanGeode()
// Log the yields for each axis / combination of axes
Object.entries(geode.crystals).forEach(([k,v]) => Chat.log(`${k}: ${v.length} crystals`))
// Render all the overlays
geode.render.crystals()
geode.render.sources()
geode.render.guides('x')
geode.render.guides('y', {
  plane: false, // Optional customization - don't render plane on y axis and use different colors for the markers
  crystals: { color: 0x00ff00, alpha: 255, fillColor: 0x00ff00, fillAlpha: 255},
  blocked: { color: 0xff0000, alpha: 255, fillColor: 0xff0000, fillAlpha: 255}
})
geode.render.guides('z')
```

# Scripts that aren't libraries that accidentally ended up in this repo

## Ender pearl tracker
![Type: Service](https://img.shields.io/badge/Type-service-informational)  
![Language: JEP (python3.9)](https://img.shields.io/badge/Language-JEP%20(python3.9)-brightgreen?logo=python&logoColor=green)
![Dependencies: more_itertools, shapely](https://img.shields.io/badge/Packages-more--itertools,%20shapely-green)

WIP for a stronghold triangulation helper.  
