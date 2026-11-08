/**
 * Any language → IPA, for the Say panel. eSpeak NG (140 voices, every script it ships a rule set
 * for) turns text into IPA; the engine's tokenizer maps what it has no gesture for to the nearest
 * sound it has. The 24 MB eSpeak data loads on first use of a non-English language, never at start.
 */
import dataUrl from "@echogarden/espeak-ng-emscripten/espeak-ng.data?url";

export interface Lang {
  /** eSpeak voice identifier, for example "roa/es", "sit/cmn" (a language alias like "fr-fr" aborts the engine) */
  code: string;
  name: string;
}

interface Worker {
  set_voice(code: string): void;
  list_voices(): { name: string; identifier: string; languages: { name: string }[] }[];
  convert_to_phonemes(text: string, ipa: boolean): { ptr: number };
}
interface ModuleLike {
  eSpeakNGWorker: new () => Worker;
  HEAPU8: Uint8Array;
}

let loading: Promise<{ w: Worker; m: ModuleLike }> | null = null;

function load(): Promise<{ w: Worker; m: ModuleLike }> {
  loading ??= (async () => {
    const mod = await import("@echogarden/espeak-ng-emscripten");
    // The library assigns its own `locateFile` over any we pass (it looks for the data next to its
    // script, which a hashed build moves), so ours is installed read-only.
    const opts: Record<string, unknown> = { printErr: (t: string) => console.error("espeak:", t), print: (t: string) => console.log("espeak:", t) };
    Object.defineProperty(opts, "locateFile", { get: () => (f: string) => (f.endsWith(".data") ? dataUrl : f), set: () => {} });
    const m = (await (mod.default as (o: object) => Promise<ModuleLike>)(opts)) as ModuleLike;
    return { w: new m.eSpeakNGWorker(), m };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

import { LANGUAGES } from "./langList.ts";

/** every language eSpeak has a voice for, by name (a static list: no download to show the menu) */
export const languages: Lang[] = [{ code: "en", name: "English (built-in dictionary)" }, ...LANGUAGES.map(([code, name]) => ({ code, name }))];

/** eSpeak's `h_ə_l_ˈəʊ w_ˈɜː_l_d` → `həlˈəʊ wˈɜːl d`: no separators, no language-switch marks, no tone digits */
export function cleanEspeakIpa(raw: string): string {
  return raw
    // accents the engine does not model (nasal, diaeresis…) come off here: its tokenizer drops a precomposed ã whole
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[_.\-0-9]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** `text` in language `code` as IPA, one clause per `|`. */
export async function textToIpa(text: string, code: string): Promise<string> {
  const { w, m } = await load();
  w.set_voice(code);
  const out: string[] = [];
  for (const clause of text.split(/[.!?;:\n]+/).map((c) => c.trim()).filter(Boolean)) {
    const r = w.convert_to_phonemes(clause, true);
    let end = r.ptr;
    while (m.HEAPU8[end]) end++;
    const ipa = cleanEspeakIpa(new TextDecoder().decode(m.HEAPU8.slice(r.ptr, end)));
    if (ipa) out.push(ipa);
  }
  return out.join(" | ");
}
