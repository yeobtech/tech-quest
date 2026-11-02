"""Draw original, aligned pixel layers for the apprentice. Requires Pillow."""
import json
from math import sin, cos, pi, radians
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/art/apprentice"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 80, 64
STATES = dict(idle=4, walk=6, run=8, jump=2, fall=2, attack=6, hurt=2, death=6, climb=4)
LAYERS = ["body", "face", "clothes", "headgear", "weapon"]
INK, SKIN, LIGHT = "#233039", "#d9966d", "#ffe0a1"
COPPER, TEAL, PALE = "#b97040", "#388d86", "#86d8b9"
sheets = {name: Image.new("RGBA", (W*8, H*len(STATES))) for name in LAYERS}


def draw(state, i):
    layers = {name: Image.new("RGBA", (W, H)) for name in LAYERS}
    d = {k: ImageDraw.Draw(im) for k, im in layers.items()}
    phase = 2*pi*i/STATES[state]
    gait = state in ("walk", "run")
    run = state == "run"
    rear = state == "climb"
    bob = round(abs(sin(phase)) * (2 if gait else 1))
    lean = 3 if run else 0
    if state == "attack":
        lean = [-2, -3, -4, 4, 5, 2][i]
        bob = [0, 1, 2, 2, 1, 0][i]
    if state == "hurt":
        lean, bob = -4+i*2, 2+i
    if state == "jump":
        lean, bob = 1+i, -2+i
    if state == "fall":
        lean, bob = -1+i, -i
    x, y = 39+lean, 22+bob
    # Exposed neck and arms. Ink outlines stay one pixel wide at native scale.
    d["body"].rectangle((x-3,y-6,x+3,y+2), fill=SKIN)
    def limb(layer, pts, color, width):
        d[layer].line(pts, fill=INK, width=width+2)
        d[layer].line(pts, fill=color, width=width)
    d["body"].polygon([(x-6,y),(x+5,y),(x+7,y+6),(45,38+bob),(34,38+bob),(x-7,y+7)],fill=SKIN,outline=INK)
    for side in [-1, 1]:
        step = round(side*sin(phase)*(10 if run else 6)) if gait else side*3
        lift = round(max(0, side*cos(phase))*(6 if run else 4)) if gait else 0
        if rear:
            step, lift = side*4, round(4+side*sin(phase)*4)
        elif state in ("jump","fall"):
            step, lift = side*(6+i), (9 if side==-1 else 3)+i*(1 if state=="jump" else -1)
        foot = (39+step, 57-lift)
        leg = [(39+side*4,39+bob),(39+side*4+step//2,47-lift//2),foot]
        limb("body",leg,SKIN,4)
        limb("clothes",leg,"#334e5c" if side<0 else "#46687a",6)
        fx, fy = foot
        d["clothes"].rectangle((fx-3,fy-3,fx+5,fy+2),fill="#473a35",outline=INK)
        d["clothes"].line((fx-2,fy-2,fx+3,fy-2),fill="#da995c")
    # Jacket, leather yoke, stitched utility belt and brass buckle.
    d["clothes"].polygon([(x-7,y),(x+6,y),(x+9,y+6),(41+5,39+bob),(32,39+bob),(x-9,y+7)], fill=TEAL, outline=INK)
    d["clothes"].line((x-6,y+3,x+5,y+3),fill=PALE,width=2)
    d["clothes"].polygon([(x-6,y+4),(x-3,y+4),(42,36+bob),(39,36+bob)],fill="#925b41")
    d["clothes"].rectangle((32,36+bob,47,40+bob),fill="#664737",outline=INK)
    d["clothes"].rectangle((39,37+bob,42,39+bob),fill="#efc564")
    d["clothes"].rectangle((32,38+bob,36,43+bob),fill=COPPER,outline=INK)
    # Angular face, dark fringe, single raised eyebrow, copper ear guard.
    face=d["face"]
    face.polygon([(x-6,y-17),(x+5,y-17),(x+7,y-12),(x+7,y-7),(x+3,y-4),(x-5,y-5),(x-7,y-10)],fill="#573e36" if rear else SKIN,outline=INK)
    if not rear:
        face.rectangle((x-5,y-14,x-2,y-8),fill="#593d36")
        face.line((x+1,y-12,x+5,y-12),fill=INK)
        face.point((x+4,y-10),fill=INK)
        face.point((x+5,y-7),fill=LIGHT)
    hat=d["headgear"]
    hat.polygon([(x-8,y-13),(x-7,y-18),(x-3,y-20),(x+4,y-20),(x+7,y-17),(x+8,y-13)],fill="#ca8942",outline=INK)
    hat.line((x-5,y-17,x+3,y-18),fill="#ffd585",width=2)
    hat.rectangle((x-8,y-14,x+8,y-12),fill="#594738")
    if not rear:
        hat.rectangle((x+2,y-16,x+7,y-12), fill="#9ee5db",outline=INK)
    for side in [-1,1]:
        hx = x + side*9
        hy = y + 11
        if rear:
            hy = y-3+round(side*cos(phase)*7)
        elif gait:
            hx -= round(side*sin(phase)*(6 if run else 4))
        elif state in ("jump","fall","hurt"):
            hx += side*(3+i)
            hy -= 6+i*2
        elif state=="attack" and side==1:
            hx=x+[5,1,-3,15,17,10][i]
            hy=y+[2,-3,-6,4,9,10][i]
        shoulder = (x+side*6,y+4)
        elbow = (hx-side*2,(shoulder[1]+hy)//2+2)
        limb("clothes",[shoulder,elbow],TEAL,5)
        limb("body",[elbow,(hx,hy)],SKIN,4)
        d["clothes"].rectangle((hx-2,hy-2,hx+2,hy+2),fill="#654638")
        if side==1:
            grip=(hx,hy)
    # Rotated polygon hammer, parked at the belt for the rear view.
    angle = ([-58,-101,-135,0,30,62][i] if state=="attack" else
             110 if rear else 72+round(sin(phase)*12 + cos(phase)*5))
    gx,gy = (34,38) if rear else grip
    a=radians(angle)
    def point(u,v):
        return round(gx+u*cos(a)-v*sin(a)),round(gy+u*sin(a)+v*cos(a))
    hammer=d["weapon"]
    hammer.polygon([point(u,v) for u,v in [(-2,-1),(13,-1),(13,1),(-2,1)]],fill=COPPER,outline=INK)
    hammer.polygon([point(u,v) for u,v in [(11,-6),(16,-6),(17,-3),(16,5),(11,5)]],fill="#83a7ad",outline=INK)
    hammer.line([point(12,-5),point(15,-5)],fill="#e0f0db",width=2)
    if state=="death":
        # Rotate around the common centre, then settle the whole pose on its soles.
        tilt=[0,12,32,55,76,90][i]
        layers={k:im.rotate(-tilt, Image.Resampling.NEAREST,center=(40,32)) for k,im in layers.items()}
        floor=max(im.getbbox()[3] for im in layers.values() if im.getbbox())
        for k,im in layers.copy().items():
            layers[k]=Image.new("RGBA",(W,H))
            layers[k].paste(im,(0,60-floor))
    return layers


for row,(state,count) in enumerate(STATES.items()):
    for frame in range(count):
        for name,im in draw(state,frame).items():
            sheets[name].paste(im,(frame*W,row*H))
for name,im in sheets.items():
    im.save(OUT / (name+".png"))
metadata=dict(width=W,height=H,foot=[40,60],layers=LAYERS,
              clips={s:dict(row=r,count=n) for r,(s,n) in enumerate(STATES.items())})
(ROOT/"src/data/apprentice.json").write_text(json.dumps(metadata,indent=2)+"\n")
