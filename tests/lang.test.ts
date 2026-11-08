import { expect, test } from "bun:test";
import { cleanEspeakIpa } from "../src/ui/lang.ts";

test("eSpeak's phoneme separators, language switches and tone digits are removed", () => {
  expect(cleanEspeakIpa("h_ə_l_ˈəʊ w_ˈɜː_l_d")).toBe("həlˈəʊ wˈɜːld");
  expect(cleanEspeakIpa("(en)_s_ˌa_w_uː_b_ˈəʊ_n_ə_(vi)_")).toBe("sˌawuːbˈəʊnə");
  expect(cleanEspeakIpa("n_i2_χ_ˈɑu2_")).toBe("niχˈɑu");
  expect(cleanEspeakIpa("b_ɔ̃_ʒ_ˈu_ʁ l_ə- m_ˈɔ̃_d")).toBe("bɔʒˈuʁ lə mˈɔd");
});

test("eSpeak's syllable dots do not become phrase breaks", () => {
  expect(cleanEspeakIpa("n_i2_χ_ˈɑu2_ s._ˈi.5_ tɕ_ˈiɛ5_")).toBe("niχˈɑu sˈi tɕˈiɛ");
});
