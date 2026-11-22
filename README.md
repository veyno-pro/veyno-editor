# VEYNO

**A free photo editor that runs entirely in your browser: RAW, masks and AI tools, with nothing uploaded.**

Try it at **[veyno.art](https://veyno.art)**. No account, no ads, no subscription.

Everything happens on your own device: RAW decoding, editing, AI and export. There is no processing server, so your photos never leave your computer.

## Features

- **RAW** from most cameras (CR2, CR3, NEF, ARW, RAF, ORF, RW2, DNG and more), processed in 16 bits and exportable as 16-bit TIFF
- **Editing:** exposure and tone, point and RGB curves, HSL, color grading, calibration, clarity, texture, dehaze, sharpening, noise reduction, lens and perspective correction
- **Looks:** 189 built-in looks, LUT import and export (.cube), color matching from a reference photo
- **Masks:** brush, linear and radial gradient, lasso, color and luminance range, plus AI masks for person, sky, background, depth and face parts
- **Local AI:** background removal, upscaling, denoising, object removal, colorizing
- **Multi-image:** HDR merge, panorama stitching, focus stacking, culling with star ratings
- **Export:** JPEG, PNG, WebP, AVIF, 16-bit TIFF, layered PSD, print layouts and contact sheets as PDF
- Installs as an app (PWA), works offline, available in English, German, Spanish and French

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
node App/veyno-server.js
```

Then open **http://127.0.0.1:8766**. On Windows you can also double-click `App/VEYNO starten.cmd`.

Use the included server rather than opening `index.html` directly: it sends the headers the AI features need for multithreading (COOP/COEP).

### With Docker

```bash
cd App
docker build -t veyno .
docker run -d --name veyno -p 8080:8765 veyno
```

Then open http://localhost:8080.

## AI models

The AI models are **not included** in this repository because of their size (about 900 MB in total). Without them, VEYNO still works: AI features fall back to classic methods or show a hint.

To enable them, download the files below, rename them as shown and place them in `App/models/`. All models are third-party work under permissive licenses; their notices are also in `App/licenses.html`.

| File in `App/models/` | Used for | Model | License | Source (download) |
|---|---|---|---|---|
| `birefnet-lite.onnx` | background removal, AI masks | BiRefNet-Lite (Peng Zheng et al.) | MIT | [studioludens/birefnet-lite-512](https://huggingface.co/studioludens/birefnet-lite-512/resolve/main/onnx/model.onnx) (`onnx/model.onnx`) |
| `segment.onnx` | background removal (fast) | U²-Net, quantized “silueta” | Apache-2.0 | [rembg release v0.0.0](https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx) (`silueta.onnx`) |
| `lama.onnx` | object removal | LaMa (Suvorov et al.) | Apache-2.0 | [Carve/LaMa-ONNX](https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx) (`lama_fp32.onnx`) |
| `migan_pipeline_v2.onnx` | object removal (fast) | MI-GAN (Picsart AI Research) | MIT | [andraniksargsyan/migan](https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx) |
| `sky.onnx` | sky detection | U²-Net sky segmentation | MIT | [JianyuanWang/skyseg](https://huggingface.co/JianyuanWang/skyseg/resolve/main/skyseg.onnx) (`skyseg.onnx`) |
| `depth.onnx` | depth masks, lens blur | Depth Anything V2 Small | Apache-2.0 | [onnx-community/depth-anything-v2-small](https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx) (`onnx/model.onnx`) |
| `scunet.onnx` | denoising | SCUNet color real PSNR (Kai Zhang et al.) | Apache-2.0 | [artiva-ai/modelos](https://huggingface.co/artiva-ai/modelos/resolve/main/scunet_color_real_psnr_512.onnx) (`scunet_color_real_psnr_512.onnx`) |
| `denoise.onnx` | denoising (fast) | CDnCNN-B from KAIR (Kai Zhang) | MIT | converted, see below |
| `ddcolor.onnx` | colorizing | DDColor-tiny | Apache-2.0 | [edgetools/ddcolor](https://huggingface.co/edgetools/ddcolor/resolve/main/ddcolor-tiny-fp16.onnx) (`ddcolor-tiny-fp16.onnx`) |
| `realesrgan.onnx` | upscaling | Real-ESRGAN general-x4v3 (xinntao) | BSD-3-Clause | [OwlMaster/AllFilesRope](https://huggingface.co/OwlMaster/AllFilesRope/resolve/main/realesr-general-x4v3.onnx) (`realesr-general-x4v3.onnx`) |
| `face.onnx` | face landmarks | MediaPipe Face Mesh (Google) | Apache-2.0 | PINTO Model Zoo, see below |

Notes on origin:
- **segment.onnx** is the pretrained U²-Net (Apache-2.0) quantized with ONNX Runtime by the author of silueta.me, without retraining, and offered to the U²-Net project in [U-2-Net issue #295](https://github.com/xuebinqin/U-2-Net/issues/295).
- **realesrgan.onnx** is the file `realesr-general-x4v3.onnx` from the mirror linked above. Name and architecture match the `realesr-general-x4v3` model from [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (BSD-3-Clause); the mirror itself does not say who exported it.

**denoise.onnx** is converted from the official KAIR weights [`dncnn_color_blind.pth`](https://github.com/cszn/KAIR/releases/download/v1.0/dncnn_color_blind.pth) ([KAIR](https://github.com/cszn/KAIR), MIT, © 2019 Kai Zhang) with the script in this repo:

```bash
pip install torch onnx onnxscript
python KI-Modell-Werkzeuge/konvertiere-dncnn-blind.py   # downloads the weights and writes denoise.onnx
mv denoise.onnx App/models/denoise.onnx
```

**face.onnx** is `face_landmark.onnx` from the [PINTO Model Zoo](https://github.com/PINTO0309/PINTO_model_zoo) (folder `032_FaceMesh`), inside a nested archive:

```bash
mkdir facemesh && cd facemesh
curl -L -o 032.tar.gz https://s3.ap-northeast-2.wasabisys.com/pinto-model-zoo/032_FaceMesh/032_FaceMesh.tar.gz
tar -xzf 032.tar.gz
tar -xzf 032_FaceMesh/01_float32/resources.tar.gz
mv face_landmark.onnx ../App/models/face.onnx
cd .. && rm -rf facemesh
```

### Checksums (SHA-256)

These are the files VEYNO uses. All of them except `denoise.onnx` were checked byte for byte against the sources above.

```
1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2  birefnet-lite.onnx
75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb  segment.onnx
1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6  lama.onnx
6f1f3530a1a2324b19752018ce756088b07973cda8d7d890034ace5c8a48c40b  migan_pipeline_v2.onnx
ab9c34c64c3d821220a2886a4a06da4642ffa14d5b30e8d5339056a089aa1d39  sky.onnx
afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c  depth.onnx
2ead3aa0d3c85458cb76480cc96c72b210fcaac24daf369ed65571efc0587141  scunet.onnx
8ce3f074d52f6bc198cecc65153f0d572e7f7233951543470b29fa0b60f8be1f  denoise.onnx
2653da00dc15e54a45e5200b61dbf82ee9ceaf56b02bb9b9657569ac775e82e6  ddcolor.onnx
09b757accd747d7e423c1d352b3e8f23e77cc5742d04bae958d4eb8082b76fa4  realesrgan.onnx
4816f87fff99f94555858c7159c9a4f688ab3c234fe384fcbf065ce3508aed78  face.onnx
```

Your own conversion of `denoise.onnx` may differ in bytes depending on the PyTorch version, but behaves the same.

## Build from source

The app lives in `Quelle/` as separate parts and is assembled into one file. Some folder and script names are German (`Quelle` = source, `Entwickler-Tools` = developer tools, `bauen` = build).

```bash
cd Entwickler-Tools
npm ci
cd ..
node Entwickler-Tools/quelle.mjs bauen     # Quelle/ → pro.html
node Entwickler-Tools/web-bauen.mjs        # pro.html → App/index.html (minified)
```

`pro.html` is the readable build, `App/index.html` the version that gets served.

### Desktop app (Electron)

The desktop app uses its own copy of the web app in `Electron/app/`. In this repository the copy is up to date. If you change the source, copy the readable build and the shared files over before building:

```bash
cp pro.html Electron/app/index.html
cp App/changelog.json App/legal.html App/licenses.html App/sw.js Electron/app/
cp App/libraw/v4/index.js App/libraw/v4/worker.js App/libraw/v4/veyno-libraw.js App/libraw/v4/veyno-libraw.wasm Electron/app/libraw/v4/
```

For the AI features in the desktop app, the models also have to be in `Electron/app/models/`.

```bash
cd Electron
npm ci
npm start                        # run
node bauen-windows.js            # Windows installers, full (needs all models) and Lite
node bauen-windows.js --nur-lite # Lite installer only, without models
```

The build script checks that the copies match and stops with a message if they don't. The installer shows a terms-of-use page from `Electron/build/lizenz.txt` (UTF-8 with BOM), which is not part of this repository; create your own before building.

## Tech

Plain HTML, CSS and JavaScript without a framework. The preview renders on the GPU via WebGL2 on a 16-bit floating-point pipeline. RAW files are decoded with LibRaw compiled to WebAssembly, and the AI models run through ONNX Runtime Web.

## License

[Apache License 2.0 with the Commons Clause](LICENSE): you may use, study and modify VEYNO, but you may not sell it or offer it as a paid service. This makes VEYNO source-available rather than open source in the OSI sense.

Third-party components keep their own licenses, see `App/licenses.html`.

## Support

VEYNO is free and ad-free and is funded by donations only: [ko-fi.com/veyno_art](https://ko-fi.com/veyno_art)

Feedback and bug reports: use the feedback button on [veyno.art](https://veyno.art). In a self-hosted copy the button only works once mail sending is set up; see `.env.example`.
