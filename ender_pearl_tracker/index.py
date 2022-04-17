if __name__ == '':
    from JsMacrosAC import *

Chat.getHistory().clearRecv()
server = World.getCurrentServerAddress()
pearls = []  # type: list[(EntityHelper, PositionCommon_Vec3D)]
traces = [] # type: list[{"pos": [int, int], "direction": [int, int]}]
listeners = []

for d in Hud.listDraw3Ds():
    d.unregister()

d3d = Hud.createDraw3D()
d3d.register()


def autoWrap(fn):
    return JavaWrapper.methodToJava(fn)


def EventHandler(event):
    def decorate(fn):
        @autoWrap
        def handler(*args, **kwargs):
            return fn(*args, **kwargs)

        listeners.append(
            JsMacros.on(event, handler)
        )

    return decorate


@EventHandler('EntityLoad')
def addPearl(e, _):
    if e.entity.getType() != 'minecraft:eye_of_ender': return
    Chat.actionbar('Tracking pearl...', False)
    pearls.append((e.entity, e.entity.getPos()))


@EventHandler('EntityUnload')
def removePearl(e, _):
    if e.entity.getType() != 'minecraft:eye_of_ender': return
    for i, (pearl, start) in enumerate(list(pearls)):
        if not pearl.isAlive():
            vec = start.toReverseVector(pearl.getPos())
            pos = pearl.getPos()
            traces.append({
                "pos": [pos.getX(),pos.getZ()],
                "direction": [vec.x2-vec.x1, vec.z2-vec.z1]
            })
            Chat.actionbar(f'Tracking pearl: Done (total: {len(traces)})', False)
            del pearls[i]


@EventHandler('EntityLoad')
def addPearl(e, _):
    if e.entity.getType() != 'minecraft:firework_rocket': return
    Chat.log(f'Estimating stronghold from {len(traces)} traces')
    doEstimation()

@autoWrap
def stopListener():
    Chat.log('Service stopped')
    for l in listeners:
        JsMacros.off(l)
    d3d.unregister()

def doEstimation():
    from more_itertools import pairwise
    import shapely.geometry

    outline = []
    buffer = 2
    while True:
        buffers = []
        for trace in traces:
            [x,z] = trace["pos"]
            [dx, dz] = trace["direction"]
            buffers.append(
                shapely.geometry.LineString([(x,z), (x+1000*dx, z+1000*dz)]).buffer(buffer)
            )
            d3d.addLine(x,70,z,x+dx*1000, 70, z+dz*1000, 0x0000ff)
        output = buffers.pop()
        while len(buffers):
            output = output & buffers.pop()

        for line in outline:
            d3d.removeLine(line)
        outline = [
            d3d.addLine(x,70,z,x2,70,z2, 0xff0000)
            for ((x,z), (x2, z2)) in pairwise(output.exterior.coords)
        ]
        if output.area > 0.5:
            buffer = buffer * 0.9
        else:
            break


# this fires when the service is stopped
event.stopListener = stopListener
