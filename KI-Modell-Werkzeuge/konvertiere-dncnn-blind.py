import os
import urllib.request
import torch
import torch.nn as nn

URL = "https://github.com/cszn/KAIR/releases/download/v1.0/dncnn_color_blind.pth"
PTH = "dncnn_color_blind.pth"

if not os.path.exists(PTH):
    print(">> Lade", URL)
    urllib.request.urlretrieve(URL, PTH)
print(">> Gewichte vorhanden:", PTH, os.path.getsize(PTH), "Bytes")

sd = torch.load(PTH, map_location="cpu")
if isinstance(sd, dict) and "state_dict" in sd:
    sd = sd["state_dict"]
keys = list(sd.keys())
prefix = ""
if keys and keys[0].startswith("model."):
    prefix = "model."
print(">> state_dict: %d Tensoren, Prefix=%r" % (len(keys), prefix))

import re
idxs = {}
for k in keys:
    m = re.match(r"model\.(\d+)\.", k)
    if m:
        idxs.setdefault(int(m.group(1)), set()).add(k.split(".")[-1])
maxidx = max(idxs)
has_bn = any("running_mean" in v for v in idxs.values())
convw = [k for k in keys if k.endswith(".weight") and sd[k].dim() == 4]
nb = len(convw)
in_nc = sd[convw[0]].shape[1]
out_nc = sd[convw[-1]].shape[0]
nc = sd[convw[0]].shape[0]
act_mode = "BR" if has_bn else "R"
print(">> Abgeleitet: in_nc=%d out_nc=%d nc=%d nb=%d act_mode=%s" % (in_nc, out_nc, nc, nb, act_mode))


def conv_block(ic, oc, mode, bias=True):
    L = []
    for t in mode:
        if t == "C":
            L.append(nn.Conv2d(ic, oc, 3, 1, 1, bias=bias))
        elif t == "B":
            L.append(nn.BatchNorm2d(oc, momentum=0.9, eps=1e-4, affine=True))
        elif t == "R":
            L.append(nn.ReLU(inplace=True))
    return L


class DnCNN(nn.Module):
    def __init__(self, in_nc, out_nc, nc, nb, act_mode):
        super().__init__()
        layers = conv_block(in_nc, nc, "C" + act_mode[-1])
        for _ in range(nb - 2):
            layers += conv_block(nc, nc, "C" + act_mode)
        layers += conv_block(nc, out_nc, "C")
        self.model = nn.Sequential(*layers)

    def forward(self, x):
        return x - self.model(x)


net = DnCNN(in_nc, out_nc, nc, nb, act_mode)
missing, unexpected = net.load_state_dict(sd, strict=False)
if missing or unexpected:
    print("   WARN missing:", missing)
    print("   WARN unexpected:", unexpected)
net.eval()
print(">> Gewichte geladen (strict=False, missing=%d unexpected=%d)" % (len(missing), len(unexpected)))

print(">> Test-Inferenz ...")
with torch.no_grad():
    y = net(torch.rand(1, in_nc, 64, 64))
print("   Ausgabeform:", tuple(y.shape))

print(">> Exportiere nach denoise.onnx (opset 17, dynamische Achsen, Legacy-Exporter) ...")
torch.onnx.export(
    net,
    torch.rand(1, in_nc, 256, 256),
    "denoise.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "b", 2: "h", 3: "w"}, "output": {0: "b", 2: "h", 3: "w"}},
    opset_version=17,
    dynamo=False,
)
print(">> FERTIG: denoise.onnx (CDnCNN-B) wurde erstellt.")
