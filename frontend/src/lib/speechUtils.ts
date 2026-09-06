/**
 * Web Speech Synthesis utility for multi-language pronunciation
 */

export function speakText(text: string, lang: "ja-JP" | "en-US" | "vi-VN" = "ja-JP", rate: number = 0.9): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Dừng câu đang nói dở

    if (!text || text.trim() === "") return false;

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = rate; // 0.9 để nghe rõ ràng hơn
    utterance.pitch = 1.0;

    // Tìm giọng đọc chuẩn theo ngôn ngữ nếu có
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchVoice = voices.find(
        (v) => v.lang === lang || v.lang.startsWith(lang.split("-")[0])
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("Speech synthesis error:", err);
    return false;
  }
}
