//! Any language's IPA reaches the engine: sounds it has no gesture for become the nearest one it
//! has, and are not dropped (a dropped sound turns "こんにちは" into "k o n n i i h a").
use chimera::phonetics::ipa::{init, tokenize_ipa};

fn say(s: &str) -> Vec<String> {
    init();
    tokenize_ipa(s).into_iter().map(|x| x.ipa).collect()
}

#[test]
fn japanese_affricate_and_a_become_known_sounds() {
    assert_eq!(say("koʔnnitɕiha"), ["k", "o", "ʔ", "n", "n", "i", "tʃ", "i", "h", "a"]);
}

#[test]
fn modifiers_and_tone_letters_are_ignored() {
    assert_eq!(say("pʰaʲ˥"), ["p", "a"]);
}

#[test]
fn clicks_and_implosives_map_to_stops() {
    assert_eq!(say("ǃaɓa"), ["c", "a", "b", "a"]);
}
