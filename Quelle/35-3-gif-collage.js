/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, batch, batchActive, exBase, fileInfo, leiseFehler, rawBusy, setFileInfo, setzeBatch, setzeBatchActive, src, state, t, toast } from './30-kern.js';
import { applyLoadedImage, serieMitLook, serieRendern } from './31-laden-exif.js';
import { GIF_MAX, arbeitsKopie, batchAufraeumen, batchEnsureCurrent, batchSrcSicher, batchThumbURL, captureLook, mkCanvas, neutralLook,
  rahmenOeffnen, renderBatchStrip, saveActiveToBatch, stapelDateiOk, stapelHinzufuegen, stapelOeffnen, zusatzBildLaden } from './33-export-stapel.js';
import { kbOeffnen, xmpMerken } from './34-hdr-panorama.js';
import { composeAt, fmtBytes, kiAusStapel, kiQuelleSetzen } from './36-export.js';
import { applyLang, setLang, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { cloneCanvas } from './36-4-ebenen-text-zeichnen.js';
/* Ende Einfuhr */
[['plusBtn','plusMenu'],['moreBtn','moreMenu'],['zval','zoomMenu'],['histGear','histMenu'],['langBtn','langMenu']].forEach(([bid,mid])=>{ const b=$(bid), mEl=$(mid);
  if(!b||!mEl) return; b.setAttribute('aria-haspopup','menu'); b.setAttribute('aria-expanded','false');
  try{ new MutationObserver(()=>{ b.setAttribute('aria-expanded', String(mEl.classList.contains('on'))); }).observe(mEl,{attributes:true,attributeFilter:['class']}); }catch(_){} });
(function(){ const lb=$('langBtn'), lm=$('langMenu'); if(lb&&lm){
  lb.onclick=(e)=>{ e.stopPropagation(); const mm=$('moreMenu'); if(mm) mm.classList.remove('on'); const pm=$('plusMenu'); if(pm) pm.classList.remove('on'); lm.classList.toggle('on'); };
  document.addEventListener('click',e=>{ if(!e.target.closest('#langMenu')&&!e.target.closest('#langBtn')) lm.classList.remove('on'); });
  lm.querySelectorAll('button[data-lang]').forEach(b=>b.onclick=()=>{ setLang(b.dataset.lang); lm.classList.remove('on'); }); } })();
(function(){ const A={ en:{lang_title:'Language'}, de:{lang_title:'Sprache'}, es:{lang_title:'Idioma'}, fr:{lang_title:'Langue'} }; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  en:{ pf_sec:'Product photo', pf_aus:'None', pf_weich:'Drop shadow', pf_boden:'Floor shadow', pf_staerke:'Opacity', pf_weichheit:'Softness', pf_abstand:'Distance', pf_spiegel:'Reflection', pf_rand:'Margin',
    hk_aendern:'Change keys', hk_standard:'Default', hk_aendern_hint:'Click a key, then press the new key. If it is taken, the two swap.', hk_o:'Original (hold) · mask overlay · crop guides',
    lv_titel:'Levels', lv_schwarz:'Black point', lv_mitte:'Midtones', lv_weiss:'White point', lv_ausgabe:'Output', lv_oschwarz:'Output black', lv_oweiss:'Output white', lv_reset:'Reset', lv_auto_fertig:'Black point {b}, white point {w}',
    rg_tiefe:'Depth', rg_tiefe_hint:'0 = far away, 255 = very close.', rg_tiefe_fehlt:'Depth model not available — the depth mask stays empty.', ai_tiefe:'Depth', tl_titel:'By depth', tl_nebel:'Fog', tl_dunst:'Distant haze', tl_licht:'Brighten front', tl_dunkel:'Darken back',
    exs_titel:'Output sharpening', exs_aus:'Off', exs_schirm:'Screen', exs_matt:'Matte', exs_glanz:'Glossy', exs_lo:'Low', exs_mid:'Standard', exs_hi:'High',
    staub_knopf:'Sensor dust', staub_titel:'Remove sensor dust', staub_empf:'Sensitivity', staub_zeigen:'Make dust visible', staub_entfernen:'Remove all',
          staub_gefunden:'{n} spots found (red circles).', staub_keine:'No dust spots found — raise the sensitivity if you see some.',
          staub_fertig:'{n} dust spots removed', pk_titel:'Point color', pk_pick:'Pick a color in the photo',
          pk_pick_hint:'Click the color in the photo you want to change', pk_farbton:'Hue', pk_saett:'Saturation', pk_hell:'Brightness', pk_bereich:'Range',
          ad_titel:'Adaptive looks', ad_himmelDrama:'Dramatic sky', ad_himmelBlau:'Bluer sky', ad_motivHervor:'Make subject pop', ad_portraetWarm:'Warm portrait',
          ad_hgEntsaett:'Desaturate background', ad_hgDunkel:'Darken background', ad_fertig:'{n} AI masks created — refine them in the Masks tab',
          ad_fertig1:'1 AI mask created — refine it in the Masks tab', ad_nichts:'Nothing found for this look in the photo (no sky or subject).',
          li_entfernen:'Remove blur', li_entfernt:'Lens blur removed', li_bearbeiten:'Editing the existing lens blur — computed again from the original.',
          gm_titel:'Face', gm_haut:'Skin', gm_augen:'Eyes', gm_iris:'Iris', gm_lippen:'Lips', gm_zaehne:'Teeth', gm_brauen:'Brows',
          gm_keins:'No face found in the photo.', canv_ki:'Fill the new border with AI', rf_knopf:'Fill empty edges',
          rf_tip:'Fill transparent edges from the photo content with AI', rf_keine:'No empty (transparent) edges in this photo.', rf_laeuft:'Filling edges … {i}/{n}',
          rf_fertig:'Empty edges filled', staub_zeigen_kratzer:'Show marking', staub_m_staub:'Sensor dust', staub_m_kratzer:'Old photos: scratches & spots',
          staub_m_kratzer_kurz:'Old photos', staub_titel_kratzer:'Repair old photos', staub_kratzer_info:'{p} % of the photo marked as damage (red).',
          staub_kratzer_lauf:'Repairing … {i}/{n}', staub_kratzer_fertig:'Scratches and spots repaired', tour_w:'Welcome to VEYNO',
          tour_wt:'A short tour of the key spots: where things are and what they do. Nothing on your photo changes. Skip any time.', tour_los:'Let’s go',
          tour_zurueck:'Back', tour_auto:'One click to start', tour_autot:'“Auto Enhance” sets light and color to suit your photo. A second click removes it again.',
          tour_orig:'Before and after', tour_origt:'Hold {k} to see the original, let go to return. X shows both side by side. Nothing gets lost.',
          tour_regler:'Fine-tune with sliders', tour_reglert:'Every slider works instantly. Double-click resets it, the ⓘ explains it.', tour_looks:'Ready-made looks',
          tour_lookst:'Looks to try sit below. One click tries one, another removes it; more in the “Looks” tab.', tour_masken:'Edit just one part',
          tour_maskent:'In the “Masks” tab the AI finds sky, person, background, face parts and even depth. The sliders then act only there.', tour_export:'Save',
          tour_exportt:'Done? Save here as JPG, PNG, AVIF or 16-bit – with presets for Instagram, web and print.', tour_hilfe:'Help when you need it',
          tour_hilfet:'Find any feature with Ctrl+K, all shortcuts with ?, and the ⓘ explains every tool. Restart this tour under “Tools”.',
          msg_unvollst:'This file seems incomplete (download or copy interrupted?). Part of the photo may be missing.', mk_inv_alles:'Invert whole mask',
          staub_licht:'Protect bright points of light', ki_abbrechen:'Cancel', ki_abgebrochen:'Canceled — the photo is unchanged', ks_nicht:'not downloaded',
          ks_loeschen:'Delete', ks_summe:'On this device: {mb}', ks_alle:'Download all for offline use ({mb})', ks_fertig:'Everything ready for offline use',
          ks_laedt:'Downloading {i}/{n} · {p} % – click to cancel', ks_geloescht:'{f}: model deleted, downloaded again when needed',
          ks_fehler:'Download failed – please try again later', li_band:'Miniature', li_band_klick:'Click where the sharp band should be.', fw_titel:'Color mapping',
          fw_verlauf:'Gradient map', fw_selektiv:'Selective', fl_mark_tip:'Mark all other photos to transfer this edit', fw_key:'Color key', fw_hell:'Keep brightness',
          fw_gruppe:'Colors', fw_g_rot:'Reds', fw_g_gelb:'Yellows', fw_g_gruen:'Greens', fw_g_cyan:'Cyans', fw_g_blau:'Blues', fw_g_magenta:'Magentas',
          fw_g_weiss:'Whites', fw_g_neutral:'Neutrals', fw_g_schwarz:'Blacks', fw_gelb:'Yellow', fw_schwarz:'Black', fw_relativ:'Relative', fw_absolut:'Absolute',
          fw_ton:'Color to keep', fw_tol:'Tolerance', fw_weich:'Softness', fw_pick:'Click a color in the photo',
          fw_grau:'That spot is almost gray – click a clearly colored area.', fw_vorgabe:'Apply this gradient',
          fw_ersetzt:'Color mapping works on top of the LUT “{n}”; removing it keeps the LUT', fw_aus:'Remove color mapping',
          fw_lut_hinweis:'Works through the LUT: strength and removal also under Looks → LUT (Look).', pa_titel:'Color palette', pa_kopieren:'Copy hex codes',
          pa_speichern:'As image', pa_klick:'Click to copy', pa_kopiert:'{h} copied', pa_alle_kopiert:'Palette copied', pa_datei:'palette',
          such_palette:'color palette colors hex design swatches', set_stiftdruck:'Pen pressure sets brush size', db_titel:'Double exposure',
          db_hint_kurz:'Expose a second photo into the subject, or blend it like a camera’s multiple exposure', db_klassisch:'Classic', db_ueber:'Overlay',
          db_kamera:'In-camera', db_mitteln:'Average', db_addieren:'Additive', db_staerke:'Strength', db_hg:'Brighten background', db_x:'Move horizontally',
          db_y:'Move vertically', db_spiegeln:'Mirror second photo', db_datei:'Choose …',
          db_kein_motiv:'No subject found – double exposure needs a person or a clear object.', db_ebene:'Double exposure', db_ebene_hg:'Bright background',
          db_fertig:'Double exposure added – Ctrl+Z takes it back', rep_glaetten:'Smooth skin',
          hint_glaetten:'Paint over skin: blotches and uneven tones even out, pores and texture stay.', rep_verschieben:'Move',
          hint_verschieben:'Paint over an object, then drag it to the new spot. The old place is filled automatically.',
          vs_ziehen:'Now drag the object to its new place (Esc cancels)', vs_fertig:'Object moved', rl_titel:'Relight',
          rl_klick:'Click in the preview where the light should come from.', rl_warm:'Warm', rl_neutral:'Neutral', rl_kuehl:'Cool', rl_umgebung:'Ambient light',
          rl_hoehe:'Lamp distance', rl_fertig:'New light applied', tour_entdecken:'Discover more',
          tour_entdeckent:'In Effects you can relight, map colors and add depth fog; Retouch smooths skin and moves objects. Each tab shows a short tip the first time.',
          tipp_keine:'No more tips',
          tipp_adjust_handy:'Tip: the row at the top of the sheet switches between light, color, curve and more. Press and hold a slider or its value to reset it.',
          tipp_adjust:'Tip: the row under the histogram switches between light, color, curve and more. Double-click a slider to reset it.',
          tipp_filter:'Tip: click a look again to remove it. Strength, Surprise me and Lightroom import are in the ☰ menu.',
          tipp_effects:'Tip: here you can relight the photo with a lamp you place, remap its colors (gradient, selective, color key) and add fog by depth.',
          tipp_mask:'Tip: the AI tiles select sky, subject or face parts in one click. The ⋯ menu of a mask adds, subtracts or intersects parts.',
          tipp_crop:'Tip: Auto-Upright straightens horizons and converging lines; empty edges are filled by AI under Size & canvas.',
          tipp_paint:'Tip: Smooth skin evens blotches and keeps pores, Move relocates an object, Old photos repairs scratches.',
          tipp_background:'Tip: besides cutting out – replace sky, lens blur with a miniature mode, and double exposure.',
          tipp_tools:'Tip: Color palette gives the six defining colors of your photo as hex codes; shortcuts can be changed.',
          tipp_files:'Tip: cull photos full screen, stack star trails, make a contact sheet or export straight into a folder.',
          tipp_draw:'Tip: a pen or Apple Pencil changes the brush size with pressure.',
          tipp_text:'Tip: drag text directly on the photo; your own fonts (TTF, OTF) can be loaded.',
          tipp_text_handy:'Tip: drag text directly on the photo; your own fonts (TTF, OTF) can be loaded, and the EXIF frame is here too.',
          set_tipps:'Short tips the first time a tab opens', akt_titel:'Actions', akt_aufnehmen:'Record', akt_stopp:'Stop', akt_anwenden:'Apply to marked',
          akt_export:'Then export all', akt_wahl:'Saved actions …', akt_speichern:'Save action', akt_loeschen:'Delete saved action', akt_name:'Name of the action',
          akt_gespeichert:'Action saved', akt_laeuft:'Recording – edit the photo as usual, then press Stop', akt_gestoppt:'Recorded: {n} steps',
          akt_keine:'Mark the photos in the batch first (Ctrl+click)', akt_foto:'Action on photo {i} of {n} …', akt_fertig:'Action applied to {n} photos',
          akt_s_cw:'Rotate right', akt_s_ccw:'Rotate left', akt_s_flipH:'Flip horizontally', akt_s_flipV:'Flip vertically', akt_s_crop:'Crop', akt_s_nr:'AI denoise',
          akt_s_up:'Upscale', akt_s_bg:'Remove background', akt_s_look:'Sliders and look', such_aktion:'actions macro record batch automatic', ex_ca:'≈',
          ex_grenzeNicht:'limit out of reach', ex_datei:'{n} file', ex_dateien:'{n} files', kl_titel:'AI model for {f}', kl_von:'{a} of {b}', kl_mb:'MB',
          kl_noch:'{s} left', kl_einmalig:'One time only – then instant, even offline.', kl_bereit:'Ready for {f}', kl_f_freistellen:'cutouts',
          kl_f_entrauschen:'denoising', kl_f_entfernen:'object removal', kl_f_auswahl:'smart selection', kl_f_himmel:'sky', kl_f_tiefe:'lens blur',
          kl_f_hochskalieren:'upscaling', kl_f_gesicht:'face retouch', kl_f_kolorieren:'colorizing', ko_knopf:'Colorize', ko_titel:'Colorize (AI)',
          ko_staerke:'Color strength', ko_rechnet:'Working out the colors …', ko_fertig:'Colorized', ko_fehlt:'The colorizing model is not available.',
    set_kiq:'AI models', kiq_hoch:'Best quality', kiq_schnell:'Fast', kiq_auto:'Chosen automatically: this device has little memory.',
          ks_geschuetzt:'protected from automatic deletion', ks_ungeschuetzt:'the browser may delete them when space runs low',
          set_kiq_hint:'Best quality uses larger models for cutouts, denoising, removal, selection, sky and depth. Better results, but slower and about 930 MB to download once.' },
  de:{ pf_sec:'Produktfoto', pf_aus:'Ohne', pf_weich:'Schlagschatten', pf_boden:'Bodenschatten', pf_staerke:'Deckkraft', pf_weichheit:'Weichheit', pf_abstand:'Abstand', pf_spiegel:'Spiegelung', pf_rand:'Rand',
    hk_aendern:'Belegung ändern', hk_standard:'Standard', hk_aendern_hint:'Auf eine Taste klicken, dann die neue Taste drücken. Ist sie schon belegt, tauschen die beiden.', hk_o:'Original (halten) · Masken-Overlay · Hilfslinien',
    lv_titel:'Tonwertkorrektur', lv_schwarz:'Schwarzpunkt', lv_mitte:'Mitteltöne', lv_weiss:'Weißpunkt', lv_ausgabe:'Ausgabe', lv_oschwarz:'Ausgabe-Schwarz', lv_oweiss:'Ausgabe-Weiß', lv_reset:'Zurücksetzen', lv_auto_fertig:'Schwarzpunkt {b}, Weißpunkt {w}',
    rg_tiefe:'Tiefe', rg_tiefe_hint:'0 = weit weg, 255 = ganz nah.', rg_tiefe_fehlt:'Tiefenmodell nicht verfügbar — die Tiefenmaske bleibt leer.', ai_tiefe:'Tiefe', tl_titel:'Nach Tiefe', tl_nebel:'Nebel', tl_dunst:'Dunst in der Ferne', tl_licht:'Vorn aufhellen', tl_dunkel:'Hinten abdunkeln',
    exs_titel:'Ausgabeschärfung', exs_aus:'Aus', exs_schirm:'Bildschirm', exs_matt:'Matt', exs_glanz:'Glänzend', exs_lo:'Niedrig', exs_mid:'Standard', exs_hi:'Hoch',
    staub_knopf:'Sensorstaub', staub_titel:'Sensorstaub entfernen', staub_empf:'Empfindlichkeit', staub_zeigen:'Staub sichtbar machen',
          staub_entfernen:'Alle entfernen', staub_gefunden:'{n} Flecken gefunden (rote Kreise).',
          staub_keine:'Keine Staubflecken gefunden — Empfindlichkeit erhöhen, falls du welche siehst.', staub_fertig:'{n} Staubflecken entfernt', pk_titel:'Punktfarbe',
          pk_pick:'Farbe im Bild anpicken', pk_pick_hint:'Im Bild auf die Farbe klicken, die du ändern willst', pk_farbton:'Farbton', pk_saett:'Sättigung',
          pk_hell:'Helligkeit', pk_bereich:'Bereich', ad_titel:'Adaptive Looks', ad_himmelDrama:'Himmel dramatisch', ad_himmelBlau:'Himmel blauer',
          ad_motivHervor:'Motiv hervorheben', ad_portraetWarm:'Porträt warm', ad_hgEntsaett:'Hintergrund entsättigen', ad_hgDunkel:'Hintergrund abdunkeln',
          ad_fertig:'{n} KI-Masken angelegt — im Masken-Reiter weiter anpassen', ad_fertig1:'1 KI-Maske angelegt — im Masken-Reiter weiter anpassen',
          ad_nichts:'Für diesen Look nichts im Foto gefunden (kein Himmel oder Motiv).', li_entfernen:'Unschärfe entfernen', li_entfernt:'Objektivunschärfe entfernt',
          li_bearbeiten:'Bearbeitet die bestehende Objektivunschärfe — wird vom Original neu gerechnet.', gm_titel:'Gesicht', gm_haut:'Haut', gm_augen:'Augen',
          gm_iris:'Iris', gm_lippen:'Lippen', gm_zaehne:'Zähne', gm_brauen:'Brauen', gm_keins:'Kein Gesicht im Foto gefunden.', canv_ki:'Neuen Rand per KI füllen',
          rf_knopf:'Leere Ränder füllen', rf_tip:'Transparente Ränder aus dem Bildinhalt per KI auffüllen',
          rf_keine:'Keine leeren (transparenten) Ränder in diesem Foto.', rf_laeuft:'Ränder werden gefüllt … {i}/{n}', rf_fertig:'Leere Ränder gefüllt',
          staub_zeigen_kratzer:'Markierung anzeigen', staub_m_staub:'Sensorstaub', staub_m_kratzer:'Alte Fotos: Kratzer & Flecken', staub_m_kratzer_kurz:'Alte Fotos',
          staub_titel_kratzer:'Alte Fotos reparieren', staub_kratzer_info:'{p} % des Fotos als Schaden markiert (rot).', staub_kratzer_lauf:'Wird repariert … {i}/{n}',
          staub_kratzer_fertig:'Kratzer und Flecken repariert', tour_w:'Willkommen bei VEYNO',
          tour_wt:'Ein kurzer Rundgang zu den wichtigsten Stellen: wo was ist und was es tut. An deinem Foto ändert sich dabei nichts. Du kannst jederzeit überspringen.',
          tour_los:'Los geht’s', tour_zurueck:'Zurück', tour_auto:'Ein Klick für den Anfang',
          tour_autot:'„Auto verbessern“ stellt Licht und Farbe passend zu deinem Foto ein. Ein zweiter Klick hebt es wieder auf.', tour_orig:'Vorher und nachher',
          tour_origt:'Halte {k} gedrückt, um das Original zu sehen; loslassen zeigt wieder deine Bearbeitung. X stellt beide nebeneinander. Verloren geht dabei nichts.',
          tour_regler:'Feinarbeit mit Reglern', tour_reglert:'Jeder Regler wirkt sofort. Doppelklick setzt ihn zurück, das ⓘ erklärt ihn.', tour_looks:'Fertige Looks',
          tour_lookst:'Unten liegen Looks zum Ausprobieren. Ein Klick probiert, noch ein Klick hebt auf; mehr davon im Reiter „Looks“.',
          tour_masken:'Nur einen Teil bearbeiten',
          tour_maskent:'Im Reiter „Masken“ erkennt die KI Himmel, Person, Hintergrund, Gesichtsteile und sogar die Tiefe. Die Regler wirken dann nur dort.',
          tour_export:'Speichern', tour_exportt:'Fertig? Hier speicherst du als JPG, PNG, AVIF oder 16 Bit – mit Vorlagen für Instagram, Web und Druck.',
          tour_hilfe:'Hilfe, wenn du sie brauchst',
          tour_hilfet:'Jede Funktion findest du mit Strg+K, alle Tastenkürzel mit ?, und das ⓘ erklärt jedes Werkzeug. Diese Tour startest du unter „Werkzeuge“ neu.',
          msg_unvollst:'Die Datei scheint unvollständig (Download oder Kopieren abgebrochen?). Ein Teil des Fotos kann fehlen.', mk_inv_alles:'Ganze Maske umkehren',
          staub_licht:'Helle Lichtpunkte schützen', ki_abbrechen:'Abbrechen', ki_abgebrochen:'Abgebrochen – das Foto ist unverändert', ks_nicht:'nicht geladen',
          ks_loeschen:'Löschen', ks_summe:'Auf diesem Gerät: {mb}', ks_alle:'Alle für offline laden ({mb})', ks_fertig:'Alles für offline geladen',
          ks_laedt:'Lädt {i}/{n} · {p} % – klicken zum Abbrechen', ks_geloescht:'{f}: Modell gelöscht, wird bei Bedarf neu geladen',
          ks_fehler:'Laden fehlgeschlagen – bitte später erneut versuchen', li_band:'Miniatur', li_band_klick:'Klicke, wo das scharfe Band liegen soll.',
          fw_titel:'Farbe umsetzen', fw_verlauf:'Verlauf', fw_selektiv:'Selektiv', fl_mark_tip:'Alle anderen Fotos markieren, um die Bearbeitung zu übertragen',
          fw_key:'Farbakzent', fw_hell:'Helligkeit erhalten', fw_gruppe:'Farben', fw_g_rot:'Rottöne', fw_g_gelb:'Gelbtöne', fw_g_gruen:'Grüntöne', fw_g_cyan:'Cyantöne',
          fw_g_blau:'Blautöne', fw_g_magenta:'Magentatöne', fw_g_weiss:'Weiß', fw_g_neutral:'Neutrale Farben', fw_g_schwarz:'Schwarz', fw_gelb:'Gelb',
          fw_schwarz:'Schwarz', fw_relativ:'Relativ', fw_absolut:'Absolut', fw_ton:'Farbe, die bleibt', fw_tol:'Toleranz', fw_weich:'Weichheit',
          fw_pick:'Farbe im Bild anklicken', fw_grau:'Die Stelle ist fast grau – klicke auf eine deutlich farbige Fläche.', fw_vorgabe:'Diesen Verlauf übernehmen',
          fw_ersetzt:'Farbe umsetzen wirkt nach der LUT „{n}“; beim Entfernen bleibt die LUT', fw_aus:'Farbe umsetzen entfernen',
          fw_lut_hinweis:'Wirkt über die LUT: Stärke und Entfernen auch unter Looks → LUT (Look).', pa_titel:'Farbpalette', pa_kopieren:'Hex-Werte kopieren',
          pa_speichern:'Als Bild', pa_klick:'Klicken zum Kopieren', pa_kopiert:'{h} kopiert', pa_alle_kopiert:'Palette kopiert', pa_datei:'palette',
          such_palette:'Farbpalette Farben Hex Design Swatches', set_stiftdruck:'Stiftdruck steuert die Pinselgröße', db_titel:'Doppelbelichtung',
          db_hint_kurz:'Ein zweites Foto ins Motiv belichten oder wie die Mehrfachbelichtung einer Kamera darüberlegen', db_klassisch:'Klassisch', db_ueber:'Überlagern',
          db_kamera:'Kamera', db_mitteln:'Mitteln', db_addieren:'Addieren', db_staerke:'Stärke', db_hg:'Hintergrund aufhellen', db_x:'Waagerecht verschieben',
          db_y:'Senkrecht verschieben', db_spiegeln:'Zweites Foto spiegeln', db_datei:'Foto …',
          db_kein_motiv:'Kein Motiv erkannt – die Doppelbelichtung braucht eine Person oder ein klares Objekt.', db_ebene:'Doppelbelichtung',
          db_ebene_hg:'Heller Hintergrund', db_fertig:'Doppelbelichtung eingefügt – Strg+Z nimmt sie zurück', rep_glaetten:'Haut glätten',
          hint_glaetten:'Über die Haut malen: Flecken und ungleiche Töne gleichen sich aus, Poren und Struktur bleiben.', rep_verschieben:'Verschieben',
          hint_verschieben:'Objekt übermalen, dann an die neue Stelle ziehen. Die alte Stelle wird automatisch gefüllt.',
          vs_ziehen:'Jetzt das Objekt an die neue Stelle ziehen (Esc bricht ab)', vs_fertig:'Objekt verschoben', rl_titel:'Licht setzen',
          rl_klick:'Klicke in die Vorschau, wo das Licht herkommen soll.', rl_warm:'Warm', rl_neutral:'Neutral', rl_kuehl:'Kühl', rl_umgebung:'Umgebungslicht',
          rl_hoehe:'Abstand der Lampe', rl_fertig:'Neues Licht übernommen', tour_entdecken:'Mehr entdecken',
          tour_entdeckent:'Unter Effekte setzt du Licht, setzt Farben um und legst Nebel nach Tiefe; die Retusche glättet Haut und verschiebt Objekte. Jeder Reiter zeigt beim ersten Öffnen einen kurzen Tipp.',
          tipp_keine:'Keine Tipps mehr',
          tipp_adjust_handy:'Tipp: Die Leiste oben im Bogen wechselt zwischen Licht, Farbe, Kurve und mehr. Regler oder Zahl gedrückt halten setzt zurück.',
          tipp_adjust:'Tipp: Die Leiste unter dem Histogramm wechselt zwischen Licht, Farbe, Kurve und mehr. Doppelklick auf einen Regler setzt ihn zurück.',
          tipp_filter:'Tipp: Ein zweiter Klick auf einen Look hebt ihn auf. Stärke, „Überrasch mich“ und Lightroom-Import stecken im ☰-Menü.',
          tipp_effects:'Tipp: Hier beleuchtest du das Foto mit einer Lampe neu, die du selbst platzierst, setzt Farben um (Verlauf, selektiv, Farbakzent) und legst Nebel nach Tiefe darüber.',
          tipp_mask:'Tipp: Die KI-Kacheln wählen Himmel, Motiv oder Gesichtsteile mit einem Klick. Über ⋯ an einer Maske fügst du Teile hinzu, ziehst ab oder schneidest.',
          tipp_crop:'Tipp: Auto-Upright richtet Horizont und stürzende Linien aus; leere Ränder füllt die KI unter Größe & Leinwand.',
          tipp_paint:'Tipp: Haut glätten gleicht Flecken aus und lässt Poren stehen, Verschieben setzt ein Objekt um, Alte Fotos repariert Kratzer.',
          tipp_background:'Tipp: Neben dem Freistellen gibt es Himmel ersetzen, Objektivunschärfe mit Miniatur-Modus und die Doppelbelichtung.',
          tipp_tools:'Tipp: Die Farbpalette liefert die sechs prägenden Farben deines Fotos als Hex-Werte; Tastenkürzel lassen sich ändern.',
          tipp_files:'Tipp: Fotos im Vollbild sichten, Sternspuren stapeln, einen Kontaktbogen machen oder direkt in einen Ordner exportieren.',
          tipp_draw:'Tipp: Mit Stift oder Apple Pencil ändert der Druck die Pinselgröße.',
          tipp_text:'Tipp: Text direkt im Foto ziehen; eigene Schriften (TTF, OTF) lassen sich laden.',
          tipp_text_handy:'Tipp: Text direkt im Foto ziehen; eigene Schriften (TTF, OTF) lassen sich laden, der EXIF-Rahmen steht hier auch.',
          set_tipps:'Kurz-Tipps beim ersten Öffnen eines Reiters', akt_titel:'Aktionen', akt_aufnehmen:'Aufnehmen', akt_stopp:'Stopp', akt_anwenden:'Auf markierte',
          akt_export:'Danach alle exportieren', akt_wahl:'Gespeicherte Aktionen …', akt_speichern:'Aktion speichern', akt_loeschen:'Gespeicherte Aktion löschen',
          akt_name:'Name der Aktion', akt_gespeichert:'Aktion gespeichert', akt_laeuft:'Aufnahme läuft – bearbeite das Foto wie gewohnt, dann Stopp',
          akt_gestoppt:'Aufgenommen: {n} Schritte', akt_keine:'Erst die Fotos im Stapel markieren (Strg+Klick)', akt_foto:'Aktion auf Foto {i} von {n} …',
          akt_fertig:'Aktion auf {n} Fotos angewendet', akt_s_cw:'Rechts drehen', akt_s_ccw:'Links drehen', akt_s_flipH:'Waagerecht spiegeln',
          akt_s_flipV:'Senkrecht spiegeln', akt_s_crop:'Zuschneiden', akt_s_nr:'KI-Entrauschen', akt_s_up:'Hochskalieren', akt_s_bg:'Hintergrund entfernen',
          akt_s_look:'Regler und Look', such_aktion:'Aktionen Makro aufzeichnen Stapel automatisch', ex_ca:'ca.', ex_grenzeNicht:'Grenze nicht erreichbar',
          ex_datei:'{n} Datei', ex_dateien:'{n} Dateien', kl_titel:'KI-Modell für {f}', kl_von:'{a} von {b}', kl_mb:'MB', kl_noch:'noch {s}',
          kl_einmalig:'Nur einmal – danach sofort da, auch offline.', kl_bereit:'Bereit für {f}', kl_f_freistellen:'Freistellen', kl_f_entrauschen:'Entrauschen',
          kl_f_entfernen:'Objekt entfernen', kl_f_auswahl:'Smart-Auswahl', kl_f_himmel:'Himmel', kl_f_tiefe:'Objektivunschärfe', kl_f_hochskalieren:'Hochskalieren',
          kl_f_gesicht:'Gesichts-Retusche', kl_f_kolorieren:'Kolorieren', ko_knopf:'Kolorieren', ko_titel:'Kolorieren (KI)', ko_staerke:'Farbstärke',
          ko_rechnet:'Farben werden berechnet …', ko_fertig:'Koloriert', ko_fehlt:'Das Kolorier-Modell ist nicht verfügbar.',
    set_kiq:'KI-Modelle', kiq_hoch:'Höchste Qualität', kiq_schnell:'Schnell', kiq_auto:'Automatisch gewählt: dieses Gerät hat wenig Arbeitsspeicher.',
          ks_geschuetzt:'vor automatischem Löschen geschützt', ks_ungeschuetzt:'der Browser darf sie bei Platzmangel löschen',
          set_kiq_hint:'Höchste Qualität nutzt größere Modelle zum Freistellen, Entrauschen, Entfernen, Auswählen und für Himmel und Tiefe. Bessere Ergebnisse, aber langsamer und einmalig rund 930 MB Download.' },
  es:{ pf_sec:'Foto de producto', pf_aus:'Ninguna', pf_weich:'Proyectada', pf_boden:'En el suelo', pf_staerke:'Opacidad', pf_weichheit:'Suavidad', pf_abstand:'Distancia', pf_spiegel:'Reflejo', pf_rand:'Margen',
    hk_aendern:'Cambiar teclas', hk_standard:'Predeterminado', hk_aendern_hint:'Haz clic en una tecla y pulsa la nueva. Si ya está ocupada, se intercambian.', hk_o:'Original (mantener) · superposición de máscara · guías de recorte',
    lv_titel:'Niveles', lv_schwarz:'Punto negro', lv_mitte:'Medios tonos', lv_weiss:'Punto blanco', lv_ausgabe:'Salida', lv_oschwarz:'Negro de salida', lv_oweiss:'Blanco de salida', lv_reset:'Restablecer', lv_auto_fertig:'Punto negro {b}, punto blanco {w}',
    rg_tiefe:'Profundidad', rg_tiefe_hint:'0 = muy lejos, 255 = muy cerca.', rg_tiefe_fehlt:'Modelo de profundidad no disponible: la máscara queda vacía.',
          ai_tiefe:'Profundidad', tl_titel:'Por profundidad', tl_nebel:'Niebla', tl_dunst:'Bruma lejana', tl_licht:'Aclarar delante', tl_dunkel:'Oscurecer detrás',
    exs_titel:'Enfoque de salida', exs_aus:'No', exs_schirm:'Pantalla', exs_matt:'Mate', exs_glanz:'Brillante', exs_lo:'Bajo', exs_mid:'Estándar', exs_hi:'Alto',
    staub_knopf:'Polvo del sensor', staub_titel:'Quitar polvo del sensor', staub_empf:'Sensibilidad', staub_zeigen:'Hacer visible el polvo',
          staub_entfernen:'Quitar todo', staub_gefunden:'{n} manchas encontradas (círculos rojos).',
          staub_keine:'No se encontró polvo: sube la sensibilidad si ves manchas.', staub_fertig:'{n} manchas de polvo quitadas', pk_titel:'Color puntual',
          pk_pick:'Elegir un color en la foto', pk_pick_hint:'Haz clic en la foto sobre el color que quieres cambiar', pk_farbton:'Tono', pk_saett:'Saturación',
          pk_hell:'Brillo', pk_bereich:'Rango', ad_titel:'Looks adaptativos', ad_himmelDrama:'Cielo dramático', ad_himmelBlau:'Cielo más azul',
          ad_motivHervor:'Destacar el sujeto', ad_portraetWarm:'Retrato cálido', ad_hgEntsaett:'Desaturar el fondo', ad_hgDunkel:'Oscurecer el fondo',
          ad_fertig:'{n} máscaras IA creadas: ajústalas en la pestaña Máscaras', ad_fertig1:'1 máscara IA creada: ajústala en la pestaña Máscaras',
          ad_nichts:'No se encontró nada para este look (ni cielo ni sujeto).', li_entfernen:'Quitar desenfoque', li_entfernt:'Desenfoque de lente quitado',
          li_bearbeiten:'Editando el desenfoque existente: se calcula de nuevo desde el original.', gm_titel:'Cara', gm_haut:'Piel', gm_augen:'Ojos', gm_iris:'Iris',
          gm_lippen:'Labios', gm_zaehne:'Dientes', gm_brauen:'Cejas', gm_keins:'No se encontró ninguna cara en la foto.', canv_ki:'Rellenar el nuevo borde con IA',
          rf_knopf:'Rellenar bordes vacíos', rf_tip:'Rellenar con IA los bordes transparentes a partir del contenido',
          rf_keine:'No hay bordes vacíos (transparentes) en esta foto.', rf_laeuft:'Rellenando bordes … {i}/{n}', rf_fertig:'Bordes vacíos rellenados',
          staub_zeigen_kratzer:'Mostrar marcado', staub_m_staub:'Polvo del sensor', staub_m_kratzer:'Fotos antiguas: arañazos y manchas',
          staub_m_kratzer_kurz:'Fotos antiguas', staub_titel_kratzer:'Reparar fotos antiguas', staub_kratzer_info:'{p} % de la foto marcado como daño (rojo).',
          staub_kratzer_lauf:'Reparando … {i}/{n}', staub_kratzer_fertig:'Arañazos y manchas reparados', tour_w:'Bienvenido a VEYNO',
          tour_wt:'Un recorrido breve por lo esencial: dónde está cada cosa y para qué sirve. Tu foto no cambia. Puedes saltarlo cuando quieras.', tour_los:'Empezar',
          tour_zurueck:'Atrás', tour_auto:'Un clic para empezar', tour_autot:'«Mejora automática» ajusta luz y color a tu foto. Un segundo clic lo quita.',
          tour_orig:'Antes y después', tour_origt:'Mantén pulsada {k} para ver el original y suelta para volver. X muestra ambos lado a lado. No se pierde nada.',
          tour_regler:'Ajuste fino con reguladores', tour_reglert:'Cada regulador actúa al instante. Doble clic lo restablece y la ⓘ lo explica.',
          tour_looks:'Looks listos', tour_lookst:'Abajo hay looks para probar. Un clic prueba, otro quita; más en la pestaña «Looks».',
          tour_masken:'Editar solo una parte',
          tour_maskent:'En la pestaña «Máscaras» la IA detecta cielo, persona, fondo, partes de la cara e incluso la profundidad. Los ajustes actúan solo ahí.',
          tour_export:'Guardar', tour_exportt:'¿Listo? Guarda aquí como JPG, PNG, AVIF o 16 bits, con plantillas para Instagram, web e impresión.',
          tour_hilfe:'Ayuda cuando la necesites',
          tour_hilfet:'Encuentra cualquier función con Ctrl+K, todos los atajos con ? y la ⓘ explica cada herramienta. Vuelve a iniciar esta guía en «Herramientas».',
          msg_unvollst:'El archivo parece incompleto (¿descarga o copia interrumpida?). Puede faltar parte de la foto.', mk_inv_alles:'Invertir toda la máscara',
          staub_licht:'Proteger puntos de luz brillantes', ki_abbrechen:'Cancelar', ki_abgebrochen:'Cancelado: la foto no ha cambiado', ks_nicht:'no descargado',
          ks_loeschen:'Eliminar', ks_summe:'En este dispositivo: {mb}', ks_alle:'Descargar todo para usar sin conexión ({mb})',
          ks_fertig:'Todo listo para usar sin conexión', ks_laedt:'Descargando {i}/{n} · {p} % – clic para cancelar',
          ks_geloescht:'{f}: modelo eliminado, se descargará cuando haga falta', ks_fehler:'La descarga falló; inténtalo más tarde', li_band:'Miniatura',
          li_band_klick:'Haz clic donde debe estar la franja nítida.', fw_titel:'Transformar color', fw_verlauf:'Degradado', fw_selektiv:'Selectiva',
          fl_mark_tip:'Marcar todas las demás fotos para transferir esta edición', fw_key:'Acento de color', fw_hell:'Mantener luminosidad', fw_gruppe:'Colores',
          fw_g_rot:'Rojos', fw_g_gelb:'Amarillos', fw_g_gruen:'Verdes', fw_g_cyan:'Cianes', fw_g_blau:'Azules', fw_g_magenta:'Magentas', fw_g_weiss:'Blancos',
          fw_g_neutral:'Neutros', fw_g_schwarz:'Negros', fw_gelb:'Amarillo', fw_schwarz:'Negro', fw_relativ:'Relativo', fw_absolut:'Absoluto',
          fw_ton:'Color que se mantiene', fw_tol:'Tolerancia', fw_weich:'Suavidad', fw_pick:'Haz clic en un color de la foto',
          fw_grau:'Ese punto es casi gris: haz clic en una zona claramente coloreada.', fw_vorgabe:'Usar este degradado',
          fw_ersetzt:'Transformar color actúa después de la LUT «{n}»; al quitarla, la LUT se mantiene', fw_aus:'Quitar transformación de color',
          fw_lut_hinweis:'Funciona mediante la LUT: intensidad y quitar también en Looks → LUT (Look).', pa_titel:'Paleta de colores', pa_kopieren:'Copiar códigos hex',
          pa_speichern:'Como imagen', pa_klick:'Clic para copiar', pa_kopiert:'{h} copiado', pa_alle_kopiert:'Paleta copiada', pa_datei:'paleta',
          such_palette:'paleta colores hex diseño muestras', set_stiftdruck:'La presión del lápiz fija el tamaño', db_titel:'Doble exposición',
          db_hint_kurz:'Exponer una segunda foto dentro del sujeto o mezclarla como la exposición múltiple de una cámara', db_klassisch:'Clásica', db_ueber:'Superponer',
          db_kamera:'Cámara', db_mitteln:'Promedio', db_addieren:'Aditivo', db_staerke:'Intensidad', db_hg:'Aclarar fondo', db_x:'Mover en horizontal',
          db_y:'Mover en vertical', db_spiegeln:'Reflejar segunda foto', db_datei:'Foto …',
          db_kein_motiv:'No se encontró sujeto: la doble exposición necesita una persona o un objeto claro.', db_ebene:'Doble exposición', db_ebene_hg:'Fondo claro',
          db_fertig:'Doble exposición añadida: Ctrl+Z la deshace', rep_glaetten:'Suavizar piel',
          hint_glaetten:'Pinta sobre la piel: manchas y tonos irregulares se igualan, poros y textura se mantienen.', rep_verschieben:'Mover',
          hint_verschieben:'Pinta sobre un objeto y arrástralo al nuevo lugar. El hueco se rellena solo.',
          vs_ziehen:'Ahora arrastra el objeto a su nuevo lugar (Esc cancela)', vs_fertig:'Objeto movido', rl_titel:'Reiluminar',
          rl_klick:'Haz clic en la vista previa de donde debe venir la luz.', rl_warm:'Cálida', rl_neutral:'Neutra', rl_kuehl:'Fría', rl_umgebung:'Luz ambiente',
          rl_hoehe:'Distancia de la lámpara', rl_fertig:'Nueva luz aplicada', tour_entdecken:'Descubre más',
          tour_entdeckent:'En Efectos puedes reiluminar, transformar colores y añadir niebla por profundidad; Retoque suaviza la piel y mueve objetos. Cada pestaña muestra un consejo la primera vez.',
          tipp_keine:'No más consejos',
          tipp_adjust_handy:'Consejo: la fila superior del panel cambia entre luz, color, curva y más. Mantén pulsado un control o su valor para restablecerlo.',
          tipp_adjust:'Consejo: la barra bajo el histograma cambia entre luz, color, curva y más. Doble clic en un control lo restablece.',
          tipp_filter:'Consejo: un segundo clic en un look lo quita. Intensidad, Sorpréndeme e importar de Lightroom están en el menú ☰.',
          tipp_effects:'Consejo: aquí puedes reiluminar la foto con una lámpara que colocas, transformar sus colores (degradado, selectiva, color key) y añadir niebla por profundidad.',
          tipp_mask:'Consejo: las teselas de IA seleccionan cielo, sujeto o partes de la cara con un clic. El menú ⋯ de una máscara suma, resta o interseca partes.',
          tipp_crop:'Consejo: Auto-Upright endereza horizontes y líneas convergentes; la IA rellena los bordes vacíos en Tamaño y lienzo.',
          tipp_paint:'Consejo: Suavizar piel iguala manchas y conserva poros, Mover recoloca un objeto, Fotos antiguas repara arañazos.',
          tipp_background:'Consejo: además de recortar – reemplazar cielo, desenfoque de lente con modo miniatura y doble exposición.',
          tipp_tools:'Consejo: Paleta de colores da los seis colores principales en hex; los atajos se pueden cambiar.',
          tipp_files:'Consejo: revisa fotos a pantalla completa, apila estelas, crea una hoja de contactos o exporta directo a una carpeta.',
          tipp_draw:'Consejo: con lápiz o Apple Pencil la presión cambia el tamaño del pincel.',
          tipp_text:'Consejo: arrastra el texto directamente sobre la foto; puedes cargar tus fuentes (TTF, OTF).',
          tipp_text_handy:'Consejo: arrastra el texto directamente sobre la foto; puedes cargar tus fuentes (TTF, OTF). El marco EXIF también está aquí.',
          set_tipps:'Consejos breves al abrir una pestaña por primera vez', akt_titel:'Acciones', akt_aufnehmen:'Grabar', akt_stopp:'Detener',
          akt_anwenden:'En marcadas', akt_export:'Después exportar todo', akt_wahl:'Acciones guardadas …', akt_speichern:'Guardar acción',
          akt_loeschen:'Borrar acción guardada', akt_name:'Nombre de la acción', akt_gespeichert:'Acción guardada',
          akt_laeuft:'Grabando: edita la foto como siempre y pulsa Detener', akt_gestoppt:'Grabado: {n} pasos',
          akt_keine:'Primero marca las fotos de la pila (Ctrl+clic)', akt_foto:'Acción en foto {i} de {n} …', akt_fertig:'Acción aplicada a {n} fotos',
          akt_s_cw:'Girar a la derecha', akt_s_ccw:'Girar a la izquierda', akt_s_flipH:'Voltear horizontal', akt_s_flipV:'Voltear vertical', akt_s_crop:'Recortar',
          akt_s_nr:'Reducción de ruido IA', akt_s_up:'Ampliar', akt_s_bg:'Quitar fondo', akt_s_look:'Ajustes y look',
          such_aktion:'acciones macro grabar lote automático', ex_ca:'aprox.', ex_grenzeNicht:'límite inalcanzable', ex_datei:'{n} archivo', ex_dateien:'{n} archivos',
          kl_titel:'Modelo de IA para {f}', kl_von:'{a} de {b}', kl_mb:'MB', kl_noch:'quedan {s}', kl_einmalig:'Solo una vez: después, al instante y sin conexión.',
          kl_bereit:'Listo para {f}', kl_f_freistellen:'recortes', kl_f_entrauschen:'reducción de ruido', kl_f_entfernen:'borrar objetos',
          kl_f_auswahl:'selección inteligente', kl_f_himmel:'cielo', kl_f_tiefe:'desenfoque de lente', kl_f_hochskalieren:'ampliación', kl_f_gesicht:'retoque facial',
          kl_f_kolorieren:'colorear', ko_knopf:'Colorear', ko_titel:'Colorear (IA)', ko_staerke:'Intensidad del color', ko_rechnet:'Calculando los colores …',
          ko_fertig:'Coloreado', ko_fehlt:'El modelo de color no está disponible.',
    set_kiq:'Modelos de IA', kiq_hoch:'Máxima calidad', kiq_schnell:'Rápido', kiq_auto:'Elegido automáticamente: este dispositivo tiene poca memoria.',
          ks_geschuetzt:'protegidos contra el borrado automático', ks_ungeschuetzt:'el navegador puede borrarlos si falta espacio',
          set_kiq_hint:'Máxima calidad usa modelos más grandes para recortar, reducir ruido, borrar, seleccionar, cielo y profundidad. Mejores resultados, pero más lento y unos 930 MB de descarga única.' },
  fr:{ pf_sec:'Photo produit', pf_aus:'Aucune', pf_weich:'Portée', pf_boden:'Au sol', pf_staerke:'Opacité', pf_weichheit:'Douceur', pf_abstand:'Distance', pf_spiegel:'Reflet', pf_rand:'Marge',
    hk_aendern:'Modifier les touches', hk_standard:'Par défaut', hk_aendern_hint:'Clique sur une touche, puis appuie sur la nouvelle. Si elle est prise, les deux s’échangent.', hk_o:'Original (maintenir) · calque du masque · repères de recadrage',
    lv_titel:'Niveaux', lv_schwarz:'Point noir', lv_mitte:'Tons moyens', lv_weiss:'Point blanc', lv_ausgabe:'Sortie', lv_oschwarz:'Noir de sortie', lv_oweiss:'Blanc de sortie', lv_reset:'Réinitialiser', lv_auto_fertig:'Point noir {b}, point blanc {w}',
    rg_tiefe:'Profondeur', rg_tiefe_hint:'0 = très loin, 255 = tout près.', rg_tiefe_fehlt:'Modèle de profondeur indisponible — le masque reste vide.',
          ai_tiefe:'Profondeur', tl_titel:'Selon la profondeur', tl_nebel:'Brouillard', tl_dunst:'Brume lointaine', tl_licht:'Éclaircir devant',
          tl_dunkel:'Assombrir derrière',
    exs_titel:'Netteté de sortie', exs_aus:'Non', exs_schirm:'Écran', exs_matt:'Mat', exs_glanz:'Brillant', exs_lo:'Faible', exs_mid:'Standard', exs_hi:'Élevée',
    staub_knopf:'Poussière du capteur', staub_titel:'Supprimer la poussière du capteur', staub_empf:'Sensibilité', staub_zeigen:'Rendre la poussière visible',
          staub_entfernen:'Tout supprimer', staub_gefunden:'{n} taches trouvées (cercles rouges).',
          staub_keine:'Aucune poussière trouvée — augmente la sensibilité si tu en vois.', staub_fertig:'{n} taches de poussière supprimées',
          pk_titel:'Couleur ponctuelle', pk_pick:'Choisir une couleur dans la photo', pk_pick_hint:'Clique dans la photo sur la couleur à modifier', pk_farbton:'Teinte',
          pk_saett:'Saturation', pk_hell:'Luminosité', pk_bereich:'Plage', ad_titel:'Looks adaptatifs', ad_himmelDrama:'Ciel dramatique', ad_himmelBlau:'Ciel plus bleu',
          ad_motivHervor:'Faire ressortir le sujet', ad_portraetWarm:'Portrait chaud', ad_hgEntsaett:'Désaturer le fond', ad_hgDunkel:'Assombrir le fond',
          ad_fertig:'{n} masques IA créés — affine-les dans l’onglet Masques', ad_fertig1:'1 masque IA créé — affine-le dans l’onglet Masques',
          ad_nichts:'Rien trouvé pour ce look dans la photo (ni ciel ni sujet).', li_entfernen:'Retirer le flou', li_entfernt:'Flou d’objectif retiré',
          li_bearbeiten:'Modification du flou existant — recalculé depuis l’original.', gm_titel:'Visage', gm_haut:'Peau', gm_augen:'Yeux', gm_iris:'Iris',
          gm_lippen:'Lèvres', gm_zaehne:'Dents', gm_brauen:'Sourcils', gm_keins:'Aucun visage trouvé dans la photo.', canv_ki:'Remplir la nouvelle bordure par IA',
          rf_knopf:'Remplir les bords vides', rf_tip:'Remplir par IA les bords transparents à partir du contenu',
          rf_keine:'Aucun bord vide (transparent) dans cette photo.', rf_laeuft:'Remplissage des bords … {i}/{n}', rf_fertig:'Bords vides remplis',
          staub_zeigen_kratzer:'Afficher le marquage', staub_m_staub:'Poussière du capteur', staub_m_kratzer:'Vieilles photos : rayures et taches',
          staub_m_kratzer_kurz:'Vieilles photos', staub_titel_kratzer:'Réparer de vieilles photos', staub_kratzer_info:'{p} % de la photo marqué comme dégât (rouge).',
          staub_kratzer_lauf:'Réparation … {i}/{n}', staub_kratzer_fertig:'Rayures et taches réparées', tour_w:'Bienvenue dans VEYNO',
          tour_wt:'Un tour rapide de l’essentiel : où se trouvent les choses et à quoi elles servent. Ta photo ne change pas. Tu peux passer à tout moment.',
          tour_los:'C’est parti', tour_zurueck:'Retour', tour_auto:'Un clic pour commencer',
          tour_autot:'« Amélioration auto » règle lumière et couleur pour ta photo. Un second clic l’annule.', tour_orig:'Avant et après',
          tour_origt:'Maintiens {k} pour voir l’original, relâche pour revenir. X affiche les deux côte à côte. Rien n’est perdu.', tour_regler:'Réglages fins',
          tour_reglert:'Chaque curseur agit tout de suite. Un double-clic le réinitialise, le ⓘ l’explique.', tour_looks:'Looks prêts',
          tour_lookst:'En bas, des looks à essayer. Un clic essaie, un autre retire ; d’autres dans l’onglet « Looks ».', tour_masken:'Ne modifier qu’une partie',
          tour_maskent:'Dans l’onglet « Masques », l’IA détecte ciel, personne, fond, parties du visage et même la profondeur. Les réglages n’agissent alors que là.',
          tour_export:'Enregistrer', tour_exportt:'Fini ? Enregistre ici en JPG, PNG, AVIF ou 16 bits – avec des modèles pour Instagram, le web et l’impression.',
          tour_hilfe:'De l’aide quand il faut',
          tour_hilfet:'Trouve chaque fonction avec Ctrl+K, tous les raccourcis avec ?, et le ⓘ explique chaque outil. Relance cette visite sous « Outils ».',
          msg_unvollst:'Le fichier semble incomplet (téléchargement ou copie interrompu ?). Une partie de la photo peut manquer.',
          mk_inv_alles:'Inverser tout le masque', staub_licht:'Protéger les points lumineux', ki_abbrechen:'Annuler', ki_abgebrochen:'Annulé – la photo est inchangée',
          ks_nicht:'non téléchargé', ks_loeschen:'Supprimer', ks_summe:'Sur cet appareil : {mb}', ks_alle:'Tout télécharger pour hors ligne ({mb})',
          ks_fertig:'Tout est prêt hors ligne', ks_laedt:'Téléchargement {i}/{n} · {p} % – cliquer pour annuler',
          ks_geloescht:'{f} : modèle supprimé, retéléchargé au besoin', ks_fehler:'Échec du téléchargement – réessaie plus tard', li_band:'Miniature',
          li_band_klick:'Clique là où la bande nette doit se trouver.', fw_titel:'Transformer la couleur', fw_verlauf:'Dégradé', fw_selektiv:'Sélective',
          fl_mark_tip:'Cocher toutes les autres photos pour y transférer cette retouche', fw_key:'Accent de couleur', fw_hell:'Garder la luminosité',
          fw_gruppe:'Couleurs', fw_g_rot:'Rouges', fw_g_gelb:'Jaunes', fw_g_gruen:'Verts', fw_g_cyan:'Cyans', fw_g_blau:'Bleus', fw_g_magenta:'Magentas',
          fw_g_weiss:'Blancs', fw_g_neutral:'Neutres', fw_g_schwarz:'Noirs', fw_gelb:'Jaune', fw_schwarz:'Noir', fw_relativ:'Relatif', fw_absolut:'Absolu',
          fw_ton:'Couleur conservée', fw_tol:'Tolérance', fw_weich:'Douceur', fw_pick:'Clique sur une couleur de la photo',
          fw_grau:'Cet endroit est presque gris – clique sur une zone nettement colorée.', fw_vorgabe:'Utiliser ce dégradé',
          fw_ersetzt:'Transformer la couleur agit après la LUT « {n} » ; en la retirant, la LUT reste', fw_aus:'Retirer la transformation',
          fw_lut_hinweis:'Agit via la LUT : intensité et retrait aussi dans Looks → LUT (Look).', pa_titel:'Palette de couleurs', pa_kopieren:'Copier les codes hex',
          pa_speichern:'En image', pa_klick:'Cliquer pour copier', pa_kopiert:'{h} copié', pa_alle_kopiert:'Palette copiée', pa_datei:'palette',
          such_palette:'palette couleurs hex design nuancier', set_stiftdruck:'La pression du stylet règle la taille', db_titel:'Double exposition',
          db_hint_kurz:'Exposer une seconde photo dans le sujet ou la mélanger comme l’exposition multiple d’un appareil', db_klassisch:'Classique',
          db_ueber:'Superposer', db_kamera:'Appareil', db_mitteln:'Moyenne', db_addieren:'Additif', db_staerke:'Intensité', db_hg:'Éclaircir le fond',
          db_x:'Déplacer horizontalement', db_y:'Déplacer verticalement', db_spiegeln:'Retourner la seconde photo', db_datei:'Photo …',
          db_kein_motiv:'Aucun sujet trouvé – la double exposition a besoin d’une personne ou d’un objet net.', db_ebene:'Double exposition', db_ebene_hg:'Fond clair',
          db_fertig:'Double exposition ajoutée – Ctrl+Z l’annule', rep_glaetten:'Lisser la peau',
          hint_glaetten:'Peins sur la peau : taches et tons irréguliers s’unifient, pores et texture restent.', rep_verschieben:'Déplacer',
          hint_verschieben:'Peins sur un objet, puis fais-le glisser à sa nouvelle place. L’ancienne place est remplie automatiquement.',
          vs_ziehen:'Fais maintenant glisser l’objet à sa nouvelle place (Échap annule)', vs_fertig:'Objet déplacé', rl_titel:'Rééclairer',
          rl_klick:'Clique dans l’aperçu d’où doit venir la lumière.', rl_warm:'Chaude', rl_neutral:'Neutre', rl_kuehl:'Froide', rl_umgebung:'Lumière ambiante',
          rl_hoehe:'Distance de la lampe', rl_fertig:'Nouvelle lumière appliquée', tour_entdecken:'À découvrir',
          tour_entdeckent:'Dans Effets, tu peux rééclairer, transformer les couleurs et ajouter du brouillard selon la profondeur ; Retouche lisse la peau et déplace des objets. Chaque onglet affiche un conseil la première fois.',
          tipp_keine:'Plus de conseils',
          tipp_adjust_handy:'Astuce : la rangée en haut du panneau passe de la lumière à la couleur, la courbe et plus. Maintiens le doigt sur un curseur ou sa valeur pour le réinitialiser.',
          tipp_adjust:'Astuce : la barre sous l’histogramme passe de la lumière à la couleur, la courbe et plus. Double-clic sur un curseur le réinitialise.',
          tipp_filter:'Astuce : un second clic sur un look l’annule. Intensité, Surprends-moi et import Lightroom sont dans le menu ☰.',
          tipp_effects:'Astuce : ici tu peux rééclairer la photo avec une lampe que tu places, transformer ses couleurs (dégradé, sélective, color key) et ajouter un brouillard selon la profondeur.',
          tipp_mask:'Astuce : les tuiles IA sélectionnent ciel, sujet ou parties du visage en un clic. Le menu ⋯ d’un masque ajoute, soustrait ou croise des parties.',
          tipp_crop:'Astuce : Auto-Upright redresse horizons et lignes fuyantes ; l’IA remplit les bords vides dans Taille et toile.',
          tipp_paint:'Astuce : Lisser la peau unifie les taches et garde les pores, Déplacer repositionne un objet, Vieilles photos répare les rayures.',
          tipp_background:'Astuce : en plus du détourage – remplacer le ciel, flou d’objectif avec mode miniature et double exposition.',
          tipp_tools:'Astuce : la palette donne les six couleurs dominantes en hex ; les raccourcis sont modifiables.',
          tipp_files:'Astuce : trier en plein écran, empiler des filés d’étoiles, faire une planche contact ou exporter dans un dossier.',
          tipp_draw:'Astuce : avec un stylet ou un Apple Pencil, la pression change la taille du pinceau.',
          tipp_text:'Astuce : fais glisser le texte sur la photo ; tes propres polices (TTF, OTF) peuvent être chargées.',
          tipp_text_handy:'Astuce : fais glisser le texte sur la photo ; tes propres polices (TTF, OTF) peuvent être chargées. Le cadre EXIF est aussi ici.',
          set_tipps:'Astuces courtes à la première ouverture d’un onglet', akt_titel:'Actions', akt_aufnehmen:'Enregistrer', akt_stopp:'Arrêter',
          akt_anwenden:'Sur les marquées', akt_export:'Puis tout exporter', akt_wahl:'Actions enregistrées …', akt_speichern:'Enregistrer l’action',
          akt_loeschen:'Supprimer l’action enregistrée', akt_name:'Nom de l’action', akt_gespeichert:'Action enregistrée',
          akt_laeuft:'Enregistrement – retouche la photo comme d’habitude, puis Arrêter', akt_gestoppt:'Enregistré : {n} étapes',
          akt_keine:'Marque d’abord les photos de la pile (Ctrl+clic)', akt_foto:'Action sur la photo {i} sur {n} …', akt_fertig:'Action appliquée à {n} photos',
          akt_s_cw:'Pivoter à droite', akt_s_ccw:'Pivoter à gauche', akt_s_flipH:'Retourner horizontalement', akt_s_flipV:'Retourner verticalement',
          akt_s_crop:'Recadrer', akt_s_nr:'Débruitage IA', akt_s_up:'Agrandir', akt_s_bg:'Supprimer l’arrière-plan', akt_s_look:'Réglages et look',
          such_aktion:'actions macro enregistrer lot automatique', ex_ca:'env.', ex_grenzeNicht:'limite inatteignable', ex_datei:'{n} fichier',
          ex_dateien:'{n} fichiers', kl_titel:'Modèle IA pour {f}', kl_von:'{a} sur {b}', kl_mb:'Mo', kl_noch:'encore {s}',
          kl_einmalig:'Une seule fois – ensuite instantané, même hors ligne.', kl_bereit:'Prêt pour {f}', kl_f_freistellen:'le détourage',
          kl_f_entrauschen:'le débruitage', kl_f_entfernen:'l’effacement d’objets', kl_f_auswahl:'la sélection intelligente', kl_f_himmel:'le ciel',
          kl_f_tiefe:'le flou d’objectif', kl_f_hochskalieren:'l’agrandissement', kl_f_gesicht:'la retouche du visage', kl_f_kolorieren:'la colorisation',
          ko_knopf:'Coloriser', ko_titel:'Coloriser (IA)', ko_staerke:'Intensité des couleurs', ko_rechnet:'Calcul des couleurs …', ko_fertig:'Colorisé',
          ko_fehlt:'Le modèle de colorisation n’est pas disponible.',
    set_kiq:'Modèles IA', kiq_hoch:'Qualité maximale', kiq_schnell:'Rapide', kiq_auto:'Choisi automatiquement : cet appareil a peu de mémoire.',
          ks_geschuetzt:'protégés contre la suppression automatique', ks_ungeschuetzt:'le navigateur peut les supprimer si l’espace manque',
          set_kiq_hint:'Qualité maximale utilise des modèles plus grands pour détourer, débruiter, effacer, sélectionner, le ciel et la profondeur. Meilleurs résultats, mais plus lent et environ 930 Mo à télécharger une fois.' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={ en:{onb_ex_row:'Sample images (Pexels)', onb_ex_n:'Example {n}'},
      de:{onb_ex_row:'Beispielbilder (Pexels)', onb_ex_n:'Beispiel {n}'},
      es:{onb_ex_row:'Imágenes de ejemplo (Pexels)', onb_ex_n:'Ejemplo {n}'},
      fr:{onb_ex_row:'Images d\'exemple (Pexels)', onb_ex_n:'Exemple {n}'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  en:{ obj_ai_loading:'Loading AI object remover…', obj_ai_fallback:'AI model unavailable, used classic fill', set_ai_eraser:'AI object remover',
        set_ai_eraser_hint:'Smarter fills on textured backgrounds. Downloads a model once; falls back to the classic method if unavailable.', bg_original:'Original',
        bg_blur:'Background blur', bg_blur_hint:'With “Original” as the background this gives the portrait effect: subject sharp, background blurred.',
    bg_p_transparent:'Transparent', bg_p_white:'White', bg_p_black:'Black', bg_p_grey:'Gray', bg_p_cream:'Cream', bg_p_studio:'Studio', bg_p_cool:'Cool', bg_p_warm:'Warm', bg_p_graphite:'Graphite', bg_p_bokeh:'Bokeh' },
  de:{ obj_ai_loading:'KI-Objektentferner wird geladen …', obj_ai_fallback:'KI-Modell nicht verfügbar, klassisch entfernt', set_ai_eraser:'KI-Objektentferner',
        set_ai_eraser_hint:'Bessere Füllung bei strukturierten Hintergründen. Lädt einmalig ein Modell; fällt sonst auf die klassische Methode zurück.',
        bg_original:'Original', bg_blur:'Hintergrund-Unschärfe',
        bg_blur_hint:'Mit „Original“ als Hintergrund ergibt das den Porträt-Effekt: Motiv scharf, Hintergrund unscharf.',
    bg_p_transparent:'Transparent', bg_p_white:'Weiß', bg_p_black:'Schwarz', bg_p_grey:'Grau', bg_p_cream:'Creme', bg_p_studio:'Studio', bg_p_cool:'Kühl', bg_p_warm:'Warm', bg_p_graphite:'Graphit', bg_p_bokeh:'Bokeh' },
  es:{ obj_ai_loading:'Cargando borrador de objetos con IA…', obj_ai_fallback:'Modelo de IA no disponible, relleno clásico',
        set_ai_eraser:'Borrador de objetos con IA',
        set_ai_eraser_hint:'Mejores rellenos en fondos con textura. Descarga un modelo una vez; si no, usa el método clásico.', bg_original:'Original',
        bg_blur:'Desenfoque de fondo', bg_blur_hint:'Con «Original» como fondo se obtiene el efecto retrato: sujeto nítido, fondo desenfocado.',
    bg_p_transparent:'Transparente', bg_p_white:'Blanco', bg_p_black:'Negro', bg_p_grey:'Gris', bg_p_cream:'Crema', bg_p_studio:'Estudio', bg_p_cool:'Frío', bg_p_warm:'Cálido', bg_p_graphite:'Grafito', bg_p_bokeh:'Bokeh' },
  fr:{ obj_ai_loading:'Chargement de la gomme à objets IA…', obj_ai_fallback:'Modèle IA indisponible, remplissage classique', set_ai_eraser:'Gomme à objets IA',
        set_ai_eraser_hint:'Meilleurs remplissages sur fonds texturés. Télécharge un modèle une fois ; sinon, méthode classique.', bg_original:'Original',
        bg_blur:'Flou d\'arrière-plan', bg_blur_hint:'Avec « Original » en fond, on obtient l\'effet portrait : sujet net, fond flou.',
    bg_p_transparent:'Transparent', bg_p_white:'Blanc', bg_p_black:'Noir', bg_p_grey:'Gris', bg_p_cream:'Crème', bg_p_studio:'Studio', bg_p_cool:'Froid', bg_p_warm:'Chaud', bg_p_graphite:'Graphite', bg_p_bokeh:'Bokeh' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); } })();
(function(){ const A={
  en:{ hk_search:'Search',
        merge_confirm:'Merging builds a new image from the source shots. Masks, texts, layers and the history will be lost, and the sliders go back to 0. Continue?',
        hdr_p_analyse:'Analyzing shots …', ex_resproj:'Working resolution only. The project file does not contain the original image.' },
  de:{ hk_search:'Suchen',
        merge_confirm:'Verschmelzen baut aus den Quellbildern ein neues Bild. Masken, Texte, Ebenen und der Verlauf gehen dabei verloren, die Regler stehen wieder auf 0. Fortfahren?',
        hdr_p_analyse:'Aufnahmen werden ausgewertet …', ex_resproj:'Nur Arbeitsauflösung. Die Projektdatei enthält das Originalbild nicht.' },
  es:{ hk_search:'Buscar',
        merge_confirm:'La fusión crea una imagen nueva a partir de las tomas originales. Se perderán máscaras, textos, capas y el historial, y los controles vuelven a 0. ¿Continuar?',
        hdr_p_analyse:'Analizando tomas …', ex_resproj:'Solo resolución de trabajo. El archivo de proyecto no contiene la imagen original.' },
  fr:{ hk_search:'Rechercher',
        merge_confirm:'La fusion crée une nouvelle image à partir des prises de vue. Les masques, textes, calques et l’historique seront perdus, et les curseurs reviennent à 0. Continuer ?',
        hdr_p_analyse:'Analyse des prises de vue …', ex_resproj:'Résolution de travail uniquement. Le fichier de projet ne contient pas l’image originale.' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); } })();
(function(){ const A={
  en:{ proj_workres:'contains the working resolution' },
  de:{ proj_workres:'enthält die Arbeitsauflösung' },
  es:{ proj_workres:'contiene la resolución de trabajo' },
  fr:{ proj_workres:'contient la résolution de travail' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={ en:{done:'Done'}, de:{done:'Fertig'}, es:{done:'Listo'}, fr:{done:'OK'} }; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  en:{ start_datei:'Choose file', start_fach:'Sample photos' },
  de:{ start_datei:'Datei wählen', start_fach:'Beispielbilder' },
  es:{ start_datei:'Elegir archivo', start_fach:'Fotos de ejemplo' },
  fr:{ start_datei:'Choisir un fichier', start_fach:'Photos d’exemple' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); } })();
(function(){ const A={
  de:{
    tour_m_rail:'Reiter-Leiste', tour_m_railt:'Tippe unten auf einen Reiter, um Werkzeuge zu öffnen: Anpassen, Looks, Effekte, Masken …',
    tour_m_sheet:'Werkzeug-Sheet', tour_m_sheett:'Das Sheet fährt von unten hoch. Ziehe es am kleinen Strich nach oben oder unten, oder tippe neben das Bild, um es zu schließen.',
    tour_m_snap:'Mehr Bild sehen', tour_m_snapt:'Wische das Sheet halb runter, um das Bild größer zu sehen, ohne das Werkzeug zu verlieren.',
    tour_m_mtHeader:'Werkzeug-Kopf', tour_m_mtHeadert:'Ganz oben im Sheet siehst du den Werkzeug-Namen, einen Zurück-Pfeil zum Zurücksetzen und „Fertig“ zum Schließen.',
    tour_m_stage:'Bild-Gesten', tour_m_staget:'Mit zwei Fingern zoomst du (Pinch) und schiebst das Bild. Halte einen Regler oder seine Zahl gedrückt, um ihn zurückzusetzen.',
    tour_m_export:'Exportieren', tour_m_exportt:'Wenn du fertig bist, tippe hier zum Speichern oder Teilen: JPG, PNG, WebP.',
    tour_m_more:'Werkzeuge', tour_m_moret:'Hier findest du Verlauf, Größe ändern, Leinwand, Tastenkürzel und diese Tour nochmal.',
    tour_m_settings:'Einstellungen', tour_m_settingst:'Sprache, Theme und alle weiteren Einstellungen sind auf dem Handy hier zu finden.',
    tour_m_maskBadge:'Masken-Hinweis', tour_m_maskBadget:'Solange eine Maske aktiv ist, wirken Änderungen nur dort. Tippe das Badge, um wieder das ganze Bild zu bearbeiten.',
    tour_m_crop:'Zuschnitt-Leiste', tour_m_cropt:'Im Zuschnitt-Modus erscheint diese Leiste mit Format-Vorgaben, „Abbrechen“ und „Übernehmen“.',
    tour_m_brand:'Tipp für den PC', tour_m_brandt:'VEYNO läuft auf dem Handy. Am Desktop hast du mehr Platz, Tastenkürzel und alle Werkzeuge. Tippe später auf „mobil“ oben links für den Link.'
  },
  en:{
    tour_m_rail:'Tab bar', tour_m_railt:'Tap a tab at the bottom to open tools: Adjust, Looks, Effects, Masks …',
    tour_m_sheet:'Tool sheet', tour_m_sheett:'The sheet slides up from below. Drag the little bar at the top up or down, or tap next to the photo to close it.',
    tour_m_snap:'See more of the photo', tour_m_snapt:'Swipe the sheet halfway down to keep the tool open while seeing a bigger preview.',
    tour_m_mtHeader:'Tool header', tour_m_mtHeadert:'At the top of the sheet you see the tool name, a reset arrow and a Done button to close.',
    tour_m_stage:'Photo gestures', tour_m_staget:'Pinch with two fingers to zoom and pan. Press and hold a slider or its value to reset it.',
    tour_m_export:'Export', tour_m_exportt:'When you are done, tap here to save or share: JPG, PNG, WebP.',
    tour_m_more:'Tools', tour_m_moret:'History, resize, canvas, shortcuts and this tour are tucked away here.',
    tour_m_settings:'Settings', tour_m_settingst:'Language, theme and every other setting live behind this gear on mobile.',
    tour_m_maskBadge:'Mask indicator', tour_m_maskBadget:'While a mask is active, edits only affect that area. Tap the badge to edit the whole photo again.',
    tour_m_crop:'Crop bar', tour_m_cropt:'In crop mode this bar shows ratio presets plus Cancel and Apply.',
    tour_m_brand:'PC tip', tour_m_brandt:'VEYNO runs on phones. On a desktop you get more room, shortcuts and every tool. Tap “mobile” at the top later for the link.'
  },
  es:{
    tour_m_rail:'Barra de pestañas', tour_m_railt:'Toca una pestaña abajo para abrir herramientas: Ajustar, Looks, Efectos, Máscaras …',
    tour_m_sheet:'Hoja de herramientas', tour_m_sheett:'La hoja sube desde abajo. Arrastra la barrita de arriba para subir o bajar, o toca junto a la foto para cerrarla.',
    tour_m_snap:'Ver más de la foto', tour_m_snapt:'Desliza la hoja a la mitad para ver más grande la foto sin perder la herramienta.',
    tour_m_mtHeader:'Cabecera de herramienta', tour_m_mtHeadert:'Arriba en la hoja ves el nombre, una flecha para restablecer y «Listo» para cerrar.',
    tour_m_stage:'Gestos de foto', tour_m_staget:'Pellizca con dos dedos para zoom y desplazamiento. Mantén pulsado un regulador o su valor para restablecerlo.',
    tour_m_export:'Exportar', tour_m_exportt:'Cuando termines, toca aquí para guardar o compartir: JPG, PNG, WebP.',
    tour_m_more:'Herramientas', tour_m_moret:'Historial, redimensionar, lienzo, atajos y esta visita están aquí.',
    tour_m_settings:'Ajustes', tour_m_settingst:'Idioma, tema y todos los demás ajustes están tras este engranaje en móvil.',
    tour_m_maskBadge:'Indicador de máscara', tour_m_maskBadget:'Mientras una máscara esté activa, los cambios solo afectan a esa zona. Toca el badge para editar toda la foto de nuevo.',
    tour_m_crop:'Barra de recorte', tour_m_cropt:'En modo recorte esta barra muestra proporciones y los botones Cancelar y Aplicar.',
    tour_m_brand:'Consejo PC', tour_m_brandt:'VEYNO funciona en móvil. En escritorio tienes más espacio, atajos y todas las herramientas. Toca «móvil» arriba luego para el enlace.'
  },
  fr:{
    tour_m_rail:"Barre d'onglets", tour_m_railt:'Touche un onglet en bas pour ouvrir des outils : Ajuster, Looks, Effets, Masques …',
    tour_m_sheet:"Volet d'outils", tour_m_sheett:'Le volet monte du bas. Glisse la petite barre du haut vers le haut ou le bas, ou touche à côté de la photo pour le fermer.',
    tour_m_snap:'Voir plus de la photo', tour_m_snapt:"Glisse le volet à mi-hauteur pour voir la photo en plus grand sans perdre l'outil.",
    tour_m_mtHeader:"En-tête d'outil", tour_m_mtHeadert:"En haut du volet : nom de l'outil, flèche de réinitialisation et bouton « OK » pour fermer.",
    tour_m_stage:'Gestes photo', tour_m_staget:"Pince à deux doigts pour zoomer et déplacer. Maintiens le doigt sur un curseur ou sa valeur pour le réinitialiser.",
    tour_m_export:'Exporter', tour_m_exportt:'Quand tu as fini, touche ici pour enregistrer ou partager : JPG, PNG, WebP.',
    tour_m_more:'Outils', tour_m_moret:'Historique, redimensionner, toile, raccourcis et cette visite sont cachés ici.',
    tour_m_settings:'Paramètres', tour_m_settingst:'Langue, thème et tous les autres réglages sont derrière cet engrenage sur mobile.',
    tour_m_maskBadge:'Indicateur de masque', tour_m_maskBadget:"Tant qu'un masque est actif, les modifs n'affectent que cette zone. Touche le badge pour éditer à nouveau toute la photo.",
    tour_m_crop:'Barre de recadrage', tour_m_cropt:'En mode recadrage cette barre affiche les ratios et les boutons Annuler et Appliquer.',
    tour_m_brand:'Astuce PC', tour_m_brandt:'VEYNO marche sur mobile. Sur ordinateur tu as plus de place, des raccourcis et tous les outils. Touche « mobile » en haut plus tard pour le lien.'
  }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  de:{ mob_badge:'mobil', pc_hint_title:'VEYNO läuft am PC besser',
        pc_hint_body:'VEYNO ist ein vollwertiger Foto-Editor mit Masken, Kurven, Retusche und KI-Werkzeugen. Die Mobile-Version ist bewusst auf die wichtigsten 10 Werkzeuge reduziert. Für feine Retusche, mehrlagiges Arbeiten oder große Exporte öffne VEYNO auf einem Desktop/Laptop unter veyno.art.',
        pc_hint_ok:'Verstanden' },
  en:{ mob_badge:'mobile', pc_hint_title:'VEYNO is better on a PC',
        pc_hint_body:'VEYNO is a full photo editor with masks, curves, retouching and AI tools. The mobile version is intentionally trimmed to the 10 most important tools. For fine retouching, multi-layer work or large exports, open VEYNO on a desktop/laptop at veyno.art.',
        pc_hint_ok:'Got it' },
  es:{ mob_badge:'móvil', pc_hint_title:'VEYNO funciona mejor en PC',
        pc_hint_body:'VEYNO es un editor de fotos completo con máscaras, curvas, retoque y herramientas de IA. La versión móvil está limitada a las 10 herramientas más importantes. Para retoques finos, trabajo multicapa o exportaciones grandes, abre VEYNO en escritorio/portátil en veyno.art.',
        pc_hint_ok:'Entendido' },
  fr:{ mob_badge:'mobile', pc_hint_title:'VEYNO fonctionne mieux sur PC',
        pc_hint_body:'VEYNO est un éditeur photo complet avec masques, courbes, retouche et outils IA. La version mobile est volontairement limitée aux 10 outils essentiels. Pour les retouches fines, le travail multicalque ou les grands exports, ouvre VEYNO sur un ordinateur de bureau/portable sur veyno.art.',
        pc_hint_ok:'Compris' },
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){
  const btn = document.getElementById('brandMobInfo');
  const modal = document.getElementById('pcHintModal');
  const okBtn = document.getElementById('pcHintOk');
  if(!btn || !modal) return;
  const open = () => modal.classList.add('on');
  const close = () => modal.classList.remove('on');
  btn.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  if(okBtn) okBtn.addEventListener('click', close);
  modal.addEventListener('pointerdown', (e) => { if(e.target === modal) close(); });
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modal.classList.contains('on')){ e.preventDefault(); close(); } });
})();
(function(){ const A={
  en:{ ai_mobile_first:'Loading AI model, may take a moment.', ai_mobile_metered:'Loading AI model, large download on mobile data.', 'tour_filter_mobilet':'Pick a look. Taps preview and applies instantly.', 'tour_settings_mobilet':'Language, theme, shortcuts and more.' },
  de:{ ai_mobile_first:'KI-Modell wird geladen, kann einen Moment dauern.', ai_mobile_metered:'KI-Modell wird geladen, großer Download über Mobilfunk.',
        'tour_filter_mobilet':'Wähle einen Look. Tipp zeigt eine Vorschau und wendet ihn sofort an.', 'tour_settings_mobilet':'Sprache, Theme, Tastenkürzel und mehr.' },
  es:{ ai_mobile_first:'Cargando modelo de IA, puede tardar un momento.', ai_mobile_metered:'Cargando modelo de IA, descarga grande con datos móviles.', 'tour_filter_mobilet':'Elige un look. El toque muestra vista previa y lo aplica.', 'tour_settings_mobilet':'Idioma, tema, atajos y más.' },
  fr:{ ai_mobile_first:'Chargement du modèle IA, peut prendre un instant.', ai_mobile_metered:'Chargement du modèle IA, gros téléchargement sur données mobiles.',
        'tour_filter_mobilet':'Choisis un look. Le tap montre un aperçu et l\'applique.', 'tour_settings_mobilet':'Langue, thème, raccourcis et plus.' },
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const pb=$('plusBtn'), pm=$('plusMenu'); if(!pb||!pm) return;
  pb.onclick=(e)=>{ e.stopPropagation(); if(pb.disabled) return; const mm=$('moreMenu'); if(mm) mm.classList.remove('on'); pm.classList.toggle('on'); };
  document.addEventListener('click',e=>{ if(!e.target.closest('#plusMenu')&&!e.target.closest('#plusBtn')) pm.classList.remove('on'); });
  if($('pmGif')) $('pmGif').onclick=()=>{ pm.classList.remove('on'); openGifModal(); };
  if($('pmCollage')) $('pmCollage').onclick=()=>{ pm.classList.remove('on'); openCollageModal(); };
  if($('pmRahmen')) $('pmRahmen').onclick=()=>{ pm.classList.remove('on'); rahmenOeffnen(); };
  if($('pmKontakt')) $('pmKontakt').onclick=()=>{ pm.classList.remove('on'); kbOeffnen(); };
  if($('pmAddImg')) $('pmAddImg').onclick=()=>{ pm.classList.remove('on'); if($('addImgInput')) $('addImgInput').click(); };
})();
export function addImagesFromFiles(files){ files=[...files]; xmpMerken(files); files=files.filter(stapelDateiOk); if(!files.length) return;
  if(!state.img){ stapelHinzufuegen(files.map(f=>({ name:f.name, file:f }))); return; }
  if(rawBusy){ toast(t('msg_rawDecoding')); return; }
  batchEnsureCurrent(); saveActiveToBatch(); const start=batch.length;
  files.forEach(f=>batch.push({ name:f.name, file:f, src:null, w:0, h:0, look:null, sel:false, thumb:null }));
  const laedt=stapelOeffnen(start); batchAufraeumen(); renderBatchStrip(); updateCardVisibility();
  laedt.then(ok=>{ if(ok) toast(t('addimg_moved'),3500); }); }
if($('addImgInput')) $('addImgInput').onchange=e=>{ addImagesFromFiles(e.target.files); e.target.value=''; };
function buildPickGrid(container, selArr){
  batchEnsureCurrent(); saveActiveToBatch();
  container.innerHTML=''; if(!batch.length){ container.innerHTML='<div class="pickEmpty">'+t('plus_needimg')+'</div>'; return; }
  const refresh=()=>{ container.querySelectorAll('.pk').forEach((el,idx)=>{ const p=selArr.indexOf(idx); el.classList.toggle('sel',p>=0); el.firstChild.textContent=p>=0?(p+1):''; }); };
  batch.forEach((e,i)=>{ if(!e.thumb&&e.src) e.thumb=batchThumbURL(e.src);
    const pk=document.createElement('div'); pk.className='pk'; if(e.thumb) pk.style.backgroundImage='url('+e.thumb+')';
    const num=document.createElement('span'); num.className='pkn'; pk.appendChild(num);
    pk.onclick=()=>{ const p=selArr.indexOf(i); if(p>=0) selArr.splice(p,1); else selArr.push(i); refresh(); if(container._onChange) container._onChange(); };
    container.appendChild(pk); });
  refresh();
}
const bearbCache=new Map(); let bearbKette=Promise.resolve(), bearbLauf=0;
function stapelBearbBild(bi, lk){ const e=batch[bi], k=bearbCache.get(bi+'/'+lk); return k&&e&&k.src===e.src&&k.look===e.look ? k.c : null; }
function stapelBearbeiten(idx, lk, jeFoto){ const lauf=bearbLauf, neutral=JSON.stringify(neutralLook());
  return bearbKette=bearbKette.then(async()=>{ for(const bi of idx){ if(lauf!==bearbLauf) return; const e=batch[bi]; if(!e||!e.src||e.laedt||stapelBearbBild(bi,lk)) continue;
      const offen=bi===batchActive;
      if(!offen&&(!e.look||!e.look.lut3d&&JSON.stringify(e.look)===neutral)) continue;
      const k=lk&&Math.max(e.w,e.h)>lk ? lk/Math.max(e.w,e.h) : 1; let c;
      try{ c=offen ? await composeAt(Math.max(1,Math.round(state.w*k)), Math.max(1,Math.round(state.h*k)), src) : await serieMitLook(e.look, ()=>serieRendern(e.src, lk)); }
      catch(err){ leiseFehler(err,'stapelBearb'); continue; }
      if(lauf!==bearbLauf){ c.width=c.height=0; return; }
      const alt=bearbCache.get(bi+'/'+lk); if(alt) alt.c.width=alt.c.height=0;
      bearbCache.set(bi+'/'+lk, { src:e.src, look:e.look, c }); if(jeFoto) jeFoto(); } }).catch(err=>leiseFehler(err,'stapelBearb')); }
function stapelBearbFrei(){ bearbLauf++; bearbCache.forEach(k=>{ k.c.width=k.c.height=0; }); bearbCache.clear(); }
let _gifEncP=null; function ensureGifEnc(){ if(window.GIFEnc) return Promise.resolve(true); if(_gifEncP) return _gifEncP;
  _gifEncP=new Promise(res=>{ const s=document.createElement('script'); s.src='vendor/gifenc.js'; s.onload=()=>res(!!window.GIFEnc);
    s.onerror=()=>res(false); document.head.appendChild(s); });
  return _gifEncP; }
const gifModal=$('gifModal'); const gifSel=[];
const GIF_LK=+(($('gifSize')&&$('gifSize').max)||800);
let gifPrevTimer=null, gifPrevIdx=0;
function stopGifPreview(){ if(gifPrevTimer){ clearTimeout(gifPrevTimer); gifPrevTimer=null; } }
function startGifPreview(){ stopGifPreview(); const pv=$('gifPreview'); if(!pv) return; const x=pv.getContext('2d');
  if(!gifSel.length){ pv.width=300; pv.height=180; x.clearRect(0,0,pv.width,pv.height); return; }
  const first=batch[gifSel[0]]; if(!first) return; const s=Math.min(300/first.w,240/first.h,1); pv.width=Math.max(1,Math.round(first.w*s)); pv.height=Math.max(1,Math.round(first.h*s)); gifPrevIdx=0;
  const tick=()=>{ if(!gifModal.classList.contains('on')||!gifSel.length){ stopGifPreview(); return; }
    const bi=gifSel[gifPrevIdx%gifSel.length], e=batch[bi]; x.clearRect(0,0,pv.width,pv.height);
    if(e&&e.src){ const sc=Math.min(pv.width/e.w,pv.height/e.h), dw=e.w*sc, dh=e.h*sc;
      x.drawImage(stapelBearbBild(bi,GIF_LK)||e.src,(pv.width-dw)/2,(pv.height-dh)/2,dw,dh); } gifPrevIdx++;
    gifPrevTimer=setTimeout(tick, Math.max(60,+$('gifDelay').value||300)); };
  tick(); }
function openGifModal(){ if(!state.img) return; ensureGifEnc(); stapelBearbFrei(); batchEnsureCurrent(); gifSel.length=0;
  for(let i=0;i<Math.min(batch.length,GIF_MAX);i++) gifSel.push(i); buildPickGrid($('gifPick'),gifSel); $('gifPick')._onChange=gifAuswahl;
  gifAuswahl(); $('gifStatus').textContent=''; gifModal.classList.add('on'); startGifPreview(); }
if($('gifDelay')) $('gifDelay').addEventListener('input',()=>{ $('gifDelayVal').textContent=$('gifDelay').value+' ms'; if(gifModal.classList.contains('on')) startGifPreview(); });
if($('gifSize')) $('gifSize').addEventListener('input',()=>{ $('gifSizeVal').textContent=$('gifSize').value+' px'; });
function gifAuswahl(){ if(gifSel.length>GIF_MAX){ gifSel.length=GIF_MAX; buildPickGrid($('gifPick'),gifSel); $('gifPick')._onChange=gifAuswahl; toast(t('gif_max'),3000); }
  startGifPreview();
  const idx=gifSel.slice();
  (idx.some(i=>batch[i]&&!batch[i].src) ? batchSrcSicher(idx).then(()=>{ if(gifModal.classList.contains('on')) startGifPreview(); }) : Promise.resolve()).then(()=>stapelBearbeiten(idx, GIF_LK)); }
if($('gifAll')) $('gifAll').onclick=()=>{ gifSel.length=0; for(let i=0;i<Math.min(batch.length,GIF_MAX);i++) gifSel.push(i); $('gifPick').querySelectorAll('.pk').forEach((el,idx)=>{ const an=idx<GIF_MAX; el.classList.toggle('sel',an); el.firstChild.textContent=an?idx+1:''; }); gifAuswahl(); };
if($('gifCancel')) $('gifCancel').onclick=()=>{ gifModal.classList.remove('on'); stopGifPreview(); stapelBearbFrei(); };
if($('gifExport')) $('gifExport').onclick=async ()=>{ if(gifSel.length<1){ toast(t('gif_needsel')); return; } if(!window.GIFEnc) await ensureGifEnc(); if(!window.GIFEnc){ toast(t('gif_fail')); return; }
  const btn=$('gifExport'); if(btn.classList.contains('busy')) return; btn.classList.add('busy');
  try{ const delay=+$('gifDelay').value, loop=$('gifLoop').checked, maxS=+$('gifSize').value;
    const da=await batchSrcSicher(gifSel.slice()); if(!da.length){ toast(t('gif_fail')); return; } await stapelBearbeiten(da, GIF_LK); if(!gifModal.classList.contains('on')) return;
    const first=batch[da[0]], sc=Math.min(1, maxS/Math.max(first.w,first.h)), W=Math.max(1,Math.round(first.w*sc)), H=Math.max(1,Math.round(first.h*sc));
    const tc=mkCanvas(W,H), tx=tc.getContext('2d',{willReadFrequently:true}); tx.imageSmoothingEnabled=true; tx.imageSmoothingQuality='high'; const frames=[];
    for(const i of da){ const e=batch[i]; tx.clearRect(0,0,W,H); tx.fillStyle='#000'; tx.fillRect(0,0,W,H);
      const s2=Math.min(W/e.w,H/e.h), dw=Math.round(e.w*s2), dh=Math.round(e.h*s2); tx.drawImage(stapelBearbBild(i,GIF_LK)||e.src,(W-dw)>>1,(H-dh)>>1,dw,dh);
      frames.push({data:tx.getImageData(0,0,W,H).data, width:W, height:H, delay}); }
    $('gifStatus').textContent=t('gif_encoding')+' 0%';
    const blob=await GIFEnc.encode(frames,{loop, onProgress:p=>{ $('gifStatus').textContent=t('gif_encoding')+' '+Math.round(p*100)+'%'; }});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=(exBase())+'.gif'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
    $('gifStatus').textContent=t('gif_done')+' · '+fmtBytes(blob.size);
  }catch(e){ toast(t('gif_fail')); }
  finally{ btn.classList.remove('busy'); } };
const colModal=$('colModal'); const colSel=[];
let colItems=[], colCur=-1, colRects=null, colW=0, colH=0, colPrevScale=1;
function colReadCtl(){ const la=$('colLayout').querySelector('.active'); return { lay: la?la.dataset.lay:'grid', gap:+$('colGap').value, bg:$('colBg').value }; }
function collageLayout(n, lay, gap){ const OUT=1600;
  if(lay==='free'){ const nc=n<=4?2:3, colWd=Math.floor((OUT-(nc+1)*gap)/nc), ch=new Array(nc).fill(gap), rects=[];
    for(let i=0;i<n;i++){ const e=batch[colItems[i].bi]; let c=0; for(let k=1;k<nc;k++) if(ch[k]<ch[c]) c=k; const h=Math.max(1,Math.round(colWd*(e?e.h/e.w:1))); rects.push({x:gap+c*(colWd+gap), y:ch[c], w:colWd, h}); ch[c]+=h+gap; }
    return { W:nc*colWd+(nc+1)*gap, H:Math.max.apply(null,ch), rects }; }
  let cols,rows; if(lay==='hstrip'){cols=n;rows=1;} else if(lay==='vstrip'){cols=1;rows=n;} else {cols=Math.ceil(Math.sqrt(n));rows=Math.ceil(n/cols);}
  const k=Math.max(cols,rows), cell=Math.max(1,Math.floor((OUT-(k+1)*gap)/k)), W=cols*cell+(cols+1)*gap, H=rows*cell+(rows+1)*gap, rects=[];
  for(let i=0;i<n;i++){ const r=Math.floor(i/cols), c=i%cols; rects.push({x:gap+c*(cell+gap), y:gap+r*(cell+gap), w:cell, h:cell}); } return {W,H,rects}; }
function colRenderTo(ctx, rects, bg, selIdx){ ctx.fillStyle=bg; ctx.fillRect(0,0,colW,colH); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  colItems.forEach((it,idx)=>{ const r=rects[idx], e=batch[it.bi]; if(!r||!e||!e.src) return; ctx.save(); ctx.beginPath(); ctx.rect(r.x,r.y,r.w,r.h); ctx.clip();
    const base=Math.max(r.w/e.w, r.h/e.h)*(it.scale||1), dw=e.w*base, dh=e.h*base;
    ctx.drawImage(stapelBearbBild(it.bi,0)||e.src, r.x+(r.w-dw)/2+(it.ox||0)*r.w, r.y+(r.h-dh)/2+(it.oy||0)*r.h, dw, dh); ctx.restore();
    if(idx===selIdx){ ctx.strokeStyle=(getComputedStyle(document.body).getPropertyValue('--accent')||'').trim()||'#52b788';
      ctx.lineWidth=Math.max(2,r.w*0.014);
      ctx.strokeRect(r.x+ctx.lineWidth/2,r.y+ctx.lineWidth/2,r.w-ctx.lineWidth,r.h-ctx.lineWidth); } }); }
function colRenderPreview(){ const pv=$('colPreview'); if(!pv||!colItems.length){ if(pv){ const x=pv.getContext('2d'); x.clearRect(0,0,pv.width,pv.height); } return; } const {lay,gap,bg}=colReadCtl();
  const L=collageLayout(colItems.length, lay, gap); colRects=L.rects; colW=L.W; colH=L.H; const s=Math.min(340/L.W, 280/L.H); colPrevScale=s;
  pv.width=Math.max(1,Math.round(L.W*s)); pv.height=Math.max(1,Math.round(L.H*s)); const x=pv.getContext('2d'); x.setTransform(s,0,0,s,0,0); x.clearRect(0,0,L.W,L.H); colRenderTo(x, L.rects, bg, colCur); x.setTransform(1,0,0,1,0,0); }
function colRenderThumbs(){ const wrap=$('colThumbs'); if(!wrap) return; wrap.innerHTML=''; colItems.forEach((it,idx)=>{ const e=batch[it.bi];
    if(e&&!e.thumb&&e.src) e.thumb=batchThumbURL(e.src); const b=document.createElement('button'); b.type='button';
    b.style.cssText='width:34px;height:34px;border-radius:8px;background:'+(e&&e.thumb?'url('+e.thumb+') center/cover':'#888')+';border:2px solid '+(idx===colCur?'var(--accent)':'var(--line-2)')+';cursor:pointer;padding:0;flex:0 0 auto';
    b.onclick=()=>{ colCur=idx; colShowItemCtl(); colRenderPreview(); colRenderThumbs(); }; wrap.appendChild(b); }); }
function colShowItemCtl(){ const row=$('colItemRow'); if(row) row.style.display=colCur>=0?'':'none'; if(colCur>=0&&$('colZoom')){ $('colZoom').value=Math.round((colItems[colCur].scale||1)*100); const _v=$('colZoomVal'); if(_v) _v.textContent=$('colZoom').value+'%'; } }
function colSync(){ if(colSel.length>9){ colSel.pop(); buildPickGrid($('colPick'),colSel); $('colPick')._onChange=colSync; toast(t('col_max')+' 9'); }
  const prev=new Map(colItems.map(it=>[it.bi,it])); colItems=colSel.map(bi=> prev.get(bi) || {bi,scale:1,ox:0,oy:0});
  if(colCur>=colItems.length) colCur=colItems.length-1; if(colCur<0&&colItems.length) colCur=0;
  colRenderPreview(); colRenderThumbs(); colShowItemCtl();
  const idx=colItems.map(it=>it.bi), neu=()=>{ if(colModal.classList.contains('on')) colRenderPreview(); };
  (colItems.some(it=>batch[it.bi]&&!batch[it.bi].src) ? batchSrcSicher(idx).then(()=>{ if(colModal.classList.contains('on')){ colRenderPreview(); colRenderThumbs(); } }) : Promise.resolve()).then(()=>stapelBearbeiten(idx, 0, neu)); }
function colHit(x,y){ if(!colRects) return -1; for(let i=colRects.length-1;i>=0;i--){ const r=colRects[i]; if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h) return i; } return -1; }
function openCollageModal(){ if(!state.img) return; stapelBearbFrei(); batchEnsureCurrent(); colSel.length=0; for(let i=0;i<Math.min(batch.length,9);i++) colSel.push(i); buildPickGrid($('colPick'),colSel);
  $('colPick')._onChange=colSync; $('colStatus').textContent=''; colModal.classList.add('on'); colSync(); }
if($('colLayout')) $('colLayout').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('colLayout').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); colRenderPreview(); });
if($('colGap')) $('colGap').addEventListener('input',()=>{ $('colGapVal').textContent=$('colGap').value+' px'; colRenderPreview(); });
if($('colBg')) $('colBg').addEventListener('input',colRenderPreview);
if($('colZoom')) $('colZoom').addEventListener('input',()=>{ if(colCur<0) return; colItems[colCur].scale=(+$('colZoom').value)/100; { const _v=$('colZoomVal'); if(_v) _v.textContent=$('colZoom').value+'%'; } colRenderPreview(); });
if($('colReplace')) $('colReplace').onclick=()=>{ if(colCur<0){ toast(t('col_selfirst')); return; } if($('colReplaceInput')) $('colReplaceInput').click(); };
if($('colReplaceInput')) $('colReplaceInput').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f||colCur<0) return;
  const im=await zusatzBildLaden(f); if(!im||colCur<0) return; { const {c,w,h}=arbeitsKopie(im);
    batch.push({name:f.name,src:c,w,h,look:null,sel:false,thumb:null}); const bi=batch.length-1; colItems[colCur].bi=bi; colSel[colCur]=bi;
    colItems[colCur].scale=1; colItems[colCur].ox=0; colItems[colCur].oy=0; buildPickGrid($('colPick'),colSel); $('colPick')._onChange=colSync;
    colRenderPreview(); colRenderThumbs(); } };
(function(){ const pv=$('colPreview'); if(!pv) return; let drag=null;
  pv.addEventListener('pointerdown',e=>{ const r=pv.getBoundingClientRect(), ix=(e.clientX-r.left)/colPrevScale, iy=(e.clientY-r.top)/colPrevScale, idx=colHit(ix,iy);
    if(idx<0) return; colCur=idx; colShowItemCtl(); colRenderThumbs(); colRenderPreview();
    drag={x:e.clientX,y:e.clientY,ox:colItems[idx].ox||0,oy:colItems[idx].oy||0,rect:colRects[idx]};
    try{pv.setPointerCapture(e.pointerId);}catch(_){} });
  pv.addEventListener('pointermove',e=>{ if(!drag||colCur<0) return; const it=colItems[colCur]; it.ox=Math.max(-0.5,Math.min(0.5,drag.ox+(e.clientX-drag.x)/colPrevScale/drag.rect.w)); it.oy=Math.max(-0.5,Math.min(0.5,drag.oy+(e.clientY-drag.y)/colPrevScale/drag.rect.h)); colRenderPreview(); });
  const up=()=>{ drag=null; }; pv.addEventListener('pointerup',up); pv.addEventListener('pointercancel',up);
  pv.addEventListener('wheel',e=>{ if(colCur<0) return; e.preventDefault(); const it=colItems[colCur];
    it.scale=Math.max(0.5,Math.min(2.5,(it.scale||1)*(e.deltaY<0?1.08:1/1.08))); if($('colZoom')){ $('colZoom').value=Math.round(it.scale*100);
      const _v=$('colZoomVal'); if(_v) _v.textContent=$('colZoom').value+'%'; } colRenderPreview(); },{passive:false}); })();
if($('colCancel')) $('colCancel').onclick=()=>{ colModal.classList.remove('on'); stapelBearbFrei(); };
if($('colApply')) $('colApply').onclick=async()=>{ if(colItems.length<2){ toast(t('col_needsel')); return; } const btn=$('colApply'); if(btn.classList.contains('busy')) return;
  btn.classList.add('busy'); try{ const idx=colItems.map(it=>it.bi); await batchSrcSicher(idx); await stapelBearbeiten(idx, 0); } finally{ btn.classList.remove('busy'); }
  if(!colModal.classList.contains('on')) return;
  const {lay,gap,bg}=colReadCtl(); const L=collageLayout(colItems.length, lay, gap); colRects=L.rects; colW=L.W; colH=L.H;
  try{ const cv=document.createElement('canvas'); cv.width=L.W; cv.height=L.H; colRenderTo(cv.getContext('2d'), L.rects, bg, -1); const url=cv.toDataURL('image/png'); const im=new Image();
    saveActiveToBatch(); const prev=batch.map(e=>({...e})), kiCol=kiAusStapel(colItems.map(it=>it.bi), true);
    im.onload=()=>{ colModal.classList.remove('on'); stapelBearbFrei(); applyLoadedImage(im,true); kiQuelleSetzen(kiCol); setFileInfo({name:'collage.png', format:'Collage', bits:8, bytes:0, fullW:im.naturalWidth, fullH:im.naturalHeight});
      setzeBatch(prev.concat([{ name:'collage.png', src:cloneCanvas(src), w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, info:fileInfo, ergebnis:true }]));
      setzeBatchActive(batch.length-1); renderBatchStrip();
      toast(t('col_done')); };
      im.onerror=()=>toast(t('col_fail')); im.src=url;
  }catch(e){ toast(t('col_fail')); } };
[gifModal,colModal].forEach(m=>{ if(m) m.addEventListener('pointerdown',e=>{ if(e.target===m){ m.classList.remove('on'); stapelBearbFrei(); } }); });
window.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(gifModal&&gifModal.classList.contains('on')){ e.preventDefault();
    gifModal.classList.remove('on'); stapelBearbFrei(); } else if(colModal&&colModal.classList.contains('on')){ e.preventDefault();
    colModal.classList.remove('on'); stapelBearbFrei(); } });
(function(){ const brand=document.querySelector('.brand'), msg=$('eggMsg'); if(!brand||!msg) return;
  let clicks=0, resetT=0, endT=0;
  brand.addEventListener('click', ()=>{
    clicks++; clearTimeout(resetT); resetT=setTimeout(()=>{ clicks=0; }, 3000);
    if(clicks<5) return;
    clicks=0; clearTimeout(resetT);
    brand.classList.remove('egg'); void brand.offsetWidth; brand.classList.add('egg');
    msg.classList.remove('on'); void msg.offsetWidth; msg.classList.add('on');
    clearTimeout(endT); endT=setTimeout(()=>{ brand.classList.remove('egg'); msg.classList.remove('on'); }, 2100);
  });
})();
