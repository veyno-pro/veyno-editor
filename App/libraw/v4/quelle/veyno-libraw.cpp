#include <emscripten.h>
#include <string.h>
#include "libraw/libraw.h"

static libraw_data_t *lr = 0;
static libraw_processed_image_t *bild = 0;

static void aufraeumen() {
  if (bild) { libraw_dcraw_clear_mem(bild); bild = 0; }
  if (lr) { libraw_close(lr); lr = 0; }
}

extern "C" {

EMSCRIPTEN_KEEPALIVE int vr_oeffnen(const unsigned char *buf, int len, int bps, int farbraum, int kameraWb, int qualitaet, int halb) {
  aufraeumen();
  lr = libraw_init(0);
  if (!lr) return -100;
  lr->params.output_bps = bps;
  lr->params.output_color = farbraum;
  lr->params.use_camera_wb = kameraWb;
  lr->params.user_qual = qualitaet;
  lr->params.half_size = halb;
  int r = libraw_open_buffer(lr, (void *)buf, (size_t)len);
  if (r != LIBRAW_SUCCESS) return r;
  return libraw_unpack(lr);
}

EMSCRIPTEN_KEEPALIVE int vr_entwickeln() {
  if (!lr) return -102;
  int r = libraw_dcraw_process(lr);
  if (r != LIBRAW_SUCCESS) return r;
  int fehler = 0;
  bild = libraw_dcraw_make_mem_image(lr, &fehler);
  if (!bild) return fehler ? fehler : -101;
  return 0;
}

EMSCRIPTEN_KEEPALIVE int vr_bild_i(int k) {
  if (!bild) return 0;
  switch (k) { case 0: return bild->width; case 1: return bild->height; case 2: return bild->colors; case 3: return bild->bits; case 4: return (int)bild->data_size; }
  return 0;
}
EMSCRIPTEN_KEEPALIVE unsigned char *vr_bild_daten() { return bild ? bild->data : 0; }
EMSCRIPTEN_KEEPALIVE void vr_bild_frei() { if (bild) { libraw_dcraw_clear_mem(bild); bild = 0; } }
EMSCRIPTEN_KEEPALIVE void vr_schliessen() { aufraeumen(); }

EMSCRIPTEN_KEEPALIVE int vr_meta_i(int k) {
  if (!lr) return 0;
  switch (k) { case 0: return lr->sizes.width; case 1: return lr->sizes.height; case 2: return lr->sizes.iwidth; case 3: return lr->sizes.iheight; case 4: return lr->sizes.flip; case 5: return (int)lr->other.timestamp; }
  return 0;
}
EMSCRIPTEN_KEEPALIVE double vr_meta_f(int k) {
  if (!lr) return 0;
  switch (k) { case 0: return lr->other.iso_speed; case 1: return lr->other.shutter; case 2: return lr->other.aperture; case 3: return lr->other.focal_len; }
  if (k >= 4 && k <= 7) return lr->color.cam_mul[k - 4];
  if (k >= 8 && k <= 10) return lr->color.pre_mul[k - 8];
  if (k >= 11 && k <= 19) return lr->color.cam_xyz[(k - 11) / 3][(k - 11) % 3];
  return 0;
}
EMSCRIPTEN_KEEPALIVE const char *vr_meta_s(int k) {
  if (!lr) return "";
  switch (k) { case 0: return lr->idata.make; case 1: return lr->idata.model; case 2: return lr->lens.Lens; case 3: return lr->other.artist; case 4: return lr->other.desc; case 5: return lr->idata.normalized_make; case 6: return lr->idata.normalized_model; }
  return "";
}
EMSCRIPTEN_KEEPALIVE const char *vr_version() { return libraw_version(); }

}
