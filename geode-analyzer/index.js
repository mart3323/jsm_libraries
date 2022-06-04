/** @typedef ScanGeodeOptions
 * @property {number} chunkRadius Chunk radius to scan around the player
 * @property {number} actualRadius After scanning chunkRadius, filter out sources that are at most this far from the player
 * @property {boolean} [showSources] Render overlay markers on crystal sources
 * @property {boolean} [showCrystals] Render overlay markers adjacent to crystal sources
 */

function getCrystals(sources) {
  const crystalsWithDuplicates = sources.flatMap(({x, y, z}) => [
    {x: x + 1, y, z},
    {x: x - 1, y, z},
    {x, y: y + 1, z},
    {x, y: y - 1, z},
    {x, y, z: z + 1},
    {x, y, z: z - 1},
  ])
  const crystals = []
  crystalsWithDuplicates.forEach(c => {
    const matches = s => s.x === c.x && s.y === c.y && s.z === c.z;
    if (sources.some(matches)) return;
    if (crystals.some(matches)) return;
    crystals.push(c)
  })
  const xCrystals = crystals.filter(c => sources.every(s => s.y !== c.y || s.z !== c.z))
  const yCrystals = crystals.filter(c => sources.every(s => s.x !== c.x || s.z !== c.z))
  const zCrystals = crystals.filter(c => sources.every(s => s.y !== c.y || s.x !== c.x))
  const blockedCrystals = crystals.filter(c => !xCrystals.includes(c) && !yCrystals.includes(c) && !zCrystals.includes(c))
  return {
    all: crystals,
    x: xCrystals,
    y: yCrystals,
    z: zCrystals,
    xy: Array.from(new Set([...xCrystals, ...yCrystals])),
    xz: Array.from(new Set([...xCrystals, ...zCrystals])),
    yz: Array.from(new Set([...yCrystals, ...zCrystals])),
    xyz: Array.from(new Set([...xCrystals, ...yCrystals, ...zCrystals])),
    blocked: blockedCrystals
  }
}

module.exports = {
  /**
   * @param {ScanGeodeOptions} options
   */
  scanGeode(options= {chunkRadius:2, actualRadius:20}) {
    const h3d = Hud.createDraw3D()
    h3d.register()

    // Scan for budding amethyst
    const here = Player.getPlayer().getPos()
    const sources = Array.from(World.findBlocksMatching('minecraft:budding_amethyst', options.chunkRadius).toArray())
      .filter((p) => {
        dx = Math.abs(p.x - here.x)
        dy = Math.abs(p.y - here.y)
        dz = Math.abs(p.z - here.z)
        return [dx, dy, dz].every(d => d < options.actualRadius)
      })
    const crystals = getCrystals(sources)

    // Calculate bounding box (positions for build guides)
    const range = {
      x: [
        sources.map(p => p.x).reduce((a, b) => Math.min(a, b), Infinity) - 2,
        sources.map(p => p.x).reduce((a, b) => Math.max(a, b), -Infinity) + 2
      ],
      y: [
        sources.map(p => p.y).reduce((a, b) => Math.min(a, b), Infinity) - 2,
        sources.map(p => p.y).reduce((a, b) => Math.max(a, b), -Infinity) + 2
      ],
      z: [
        sources.map(p => p.z).reduce((a, b) => Math.min(a, b), Infinity) - 2,
        sources.map(p => p.z).reduce((a, b) => Math.max(a, b), -Infinity) + 2
      ]
    }

    return {
      overlay: h3d,
      crystals: crystals,
      render: {
        /** Render markers on budding amethyst blocks */
        sources: ({size = .1, color = 0xe522ff} = {}) => sources.forEach(({
                                                                            x,
                                                                            y,
                                                                            z
                                                                          }) => h3d.addPoint(x + .5, y + .5, z + .5, size, color)),
        /**
         * Render markers on the spaces next to the budding amethyst blocks - where crystals will grow
         * @param size Size of the markers
         * @param color Color of the markers for crystals that are accessible
         * @param blockedColor Color of the markers for crystals which are not accessible
         */
        crystals: ({size = .1, color = 0xEAB3FF, blockedColor = 0xFF5D78} = {}) => {
          crystals.all.forEach(c => {
            let isBlocked = crystals.blocked.includes(c);
            const {x, y, z} = c;
            h3d.addPoint(x + .5, y + .5, z + .5, size, isBlocked ? blockedColor : color)
          })
        },
        /** @typedef Color
         * @property {number} color
         * @property {number} alpha
         * @property {number} fillColor
         * @property {number} fillAlpha
         */
        /**
         * Render guides along the three major axis, showing where to build flying machines
         * Consists of a plane down the middle of a block to make it easier to see, and boxes representing where to build and not build the flying machines
         * @param {'x'|'y'|'z'} axis
         * @param options Options for the render overlay - each option consists of colors and alphas, or the whole thing can be set to null to skip rendering that guide entirely
         * @param {Color} options.plane Options for the plane that will be rendered through the middle of the build guides
         * Recommended to fade away the background and make the guides easier to see
         * @param {Color} options.crystals Options for the markers for crystal positions - flying machines should be built to cover as many of these as possible
         * @param {Color} options.blocked Options for the markers for budding amethyst positions - flying machines should be built around this block to avoid breaking any sources
         */
        guides: (axis, {
          plane:p = {color: 0xffffff, alpha: 0, fillColor: 0x000000, fillAlpha: 100},
          crystals:c = {color: 0x00ff00, alpha: 200, fillColor: 0x00ff00, fillAlpha: 50},
          blocked:b = {color: 0xff0000, alpha: 100, fillColor: 0xff0000, fillAlpha: 50}
        } = {}) => {
          if (p) {
            const plane = h3d.addBox(range.x[0], range.y[0], range.z[0], range.x[1], range.y[1], range.z[1], p.color, p.alpha, p.fillColor, p.fillAlpha, true, true)
            plane.pos[axis + '1'] = plane.pos[axis + '1'] - 0.5
            plane.pos[axis + '2'] = plane.pos[axis + '1']
          }
          if (c) {
            for (const {x,y,z} of crystals[axis]) {
              const box = h3d.addPoint(x + .5, y + .5, z + .5, .3, c.color, c.alpha, true)
              box.setFill(c.fillAlpha > 0);
              box.setFillColor(c.fillColor);
              box.setFillAlpha(c.fillAlpha);
              box.pos[axis + '1'] = range[axis][0] + 0.1
              box.pos[axis + '2'] = range[axis][0] - 1.1
            }
          }
          if (b) {
            for (const {x,y,z} of sources) {
              const box = h3d.addPoint(x + .5, y + .5, z + .5, .3, b.color, b.alpha, true)
              box.setFill(b.fillAlpha > 0);
              box.setFillColor(b.fillColor);
              box.setFillAlpha(b.fillAlpha);
              box.pos[axis + '1'] = range[axis][0] + 0.1
              box.pos[axis + '2'] = range[axis][0] - 1.1
            }
          }
        }
      }
    }
  }
}
