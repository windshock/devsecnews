#!/usr/bin/env python3
"""Generate per-card narration audio files with Qwen3-TTS (MLX)."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any

CARD_META_RE = re.compile(r"<!--CARD\s*([\s\S]*?)-->", re.MULTILINE)
HTTP_URL_RE = re.compile(r"https?://[^\s)]+")

# Frequently used terms in monthly cards. Unknown ASCII words are left as-is.
EN_TO_KO = {
    "node.js": "노드제이에스",
    "node": "노드",
    "java": "자바",
    "openclaw": "오픈클로우",
    "swiper": "스와이퍼",
    "tomcat": "톰캣",
    "avro": "아브로",
    "org.apache.avro": "오알지 아파치 아브로",
    "google": "구글",
    "editor": "에디터",
    "editors": "에디터스",
    "pick": "픽",
    "summary": "서머리",
    "checklist": "체크리스트",
    "skill": "스킬",
    "skills": "스킬",
    "skill.md": "스킬 엠디",
    "agent": "에이전트",
    "user": "유저",
    "human": "휴먼",
    "origin": "오리진",
    "alignment": "얼라인먼트",
    "mandatory": "맨더토리",
    "oversight": "오버사이트",
    "critic": "크리틱",
    "sets": "세츠",
    "path": "패스",
    "traversal": "트래버설",
    "prototype": "프로토타입",
    "pollution": "폴루션",
    "progress": "프로그레스",
    "report": "리포트",
    "responsible": "리스폰서블",
    "sdk": "에스디케이",
    "schema": "스키마",
    "code": "코드",
    "injection": "인젝션",
    "safebins": "세이프빈즈",
    "workspace": "워크스페이스",
    "allowlist": "얼로우리스트",
    "merge": "머지",
    "applypatch": "어플라이패치",
    "apply_patch": "어플라이패치",
    "clawhub": "클로허브",
    "clawdbot": "클로드봇",
    "pr": "피알",
    "ci": "씨아이",
    "ai": "에이아이",
    "prerequisite": "프리리퀴짓",
}

KNOWN_TERM_PATTERNS = [
    (
        re.compile(
            rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])",
            re.IGNORECASE,
        ),
        value,
    )
    for term, value in sorted(EN_TO_KO.items(), key=lambda kv: len(kv[0]), reverse=True)
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate card narration WAV files using local Qwen3-TTS models."
    )
    parser.add_argument(
        "--month",
        default=(__import__("os").environ.get("DEVSECNEWS_MONTH") or "2026-01"),
        help="Target month (default: DEVSECNEWS_MONTH or 2026-01)",
    )
    parser.add_argument(
        "--input",
        help="Input markdown path (default: content/devsecnews-YYYY-MM-node-java.md)",
    )
    parser.add_argument(
        "--out-dir",
        help="Output directory (default: cards/devsecnews-YYYY-MM-node-java/audio)",
    )
    parser.add_argument(
        "--qwen-dir",
        default="qwen3-tts-apple-silicon",
        help="qwen3-tts-apple-silicon repo directory",
    )
    parser.add_argument(
        "--model",
        default="Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit",
        help="Model folder name under <qwen-dir>/models",
    )
    parser.add_argument(
        "--speaker",
        default="Sohee",
        help="Voice name for CustomVoice model (default: Sohee)",
    )
    parser.add_argument(
        "--instruct",
        default="Calm and clear Korean security news narration.",
        help="Voice instruction prompt",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Speech speed multiplier (default: 1.0)",
    )
    parser.add_argument(
        "--lang",
        default="ko",
        help="Language code for synthesis (default: ko)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only render the first N cards (0 means all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only emit text files and manifest without generating WAV",
    )
    return parser.parse_args()


def resolve_paths(args: argparse.Namespace) -> tuple[Path, Path]:
    base = f"devsecnews-{args.month}-node-java"
    input_path = Path(args.input or f"content/{base}.md")
    out_dir = Path(args.out_dir or f"cards/{base}/audio")
    return input_path, out_dir


def parse_card_meta(markdown_text: str) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for raw in CARD_META_RE.findall(markdown_text):
        block = raw.strip()
        if not block:
            continue
        try:
            obj = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            cards.append(obj)
    return cards


def convert_english_to_korean(text: str) -> str:
    converted = text

    # First pass: known security terms and product names.
    for pattern, replacement in KNOWN_TERM_PATTERNS:
        converted = pattern.sub(replacement, converted)

    # CVE/GHSA IDs become Korean letter pronunciation + numeric payload.
    converted = re.sub(
        r"\bCVE-(\d{4})-(\d+)\b",
        lambda m: f"씨브이이 {m.group(1)} {m.group(2)}",
        converted,
        flags=re.IGNORECASE,
    )
    converted = re.sub(
        r"\bGHSA-([A-Za-z0-9-]+)\b",
        lambda m: "지에이치에스에이 " + m.group(1).replace("-", " "),
        converted,
        flags=re.IGNORECASE,
    )

    # Remaining ASCII words are kept as-is.
    def replace_ascii_word(match: re.Match[str]) -> str:
        token = match.group(0)
        lowered = token.lower()
        if lowered in EN_TO_KO:
            return EN_TO_KO[lowered]
        return token

    converted = re.sub(r"[A-Za-z][A-Za-z0-9._+-]*", replace_ascii_word, converted)
    return converted


def remove_special_characters(text: str) -> str:
    # Keep Hangul, numbers, basic Latin letters, spaces, and core punctuation.
    cleaned = re.sub(r"[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?]", " ", text)
    cleaned = re.sub(r"\s+([.,!?])", r"\1", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def strip_markdown(text: Any) -> str:
    raw = str(text or "")
    raw = raw.replace("\r\n", "\n")
    raw = HTTP_URL_RE.sub("", raw)
    raw = re.sub(r"`([^`]*)`", r"\1", raw)
    raw = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", raw)
    raw = re.sub(r"[*_]{1,3}", "", raw)
    raw = re.sub(r"^#{1,6}\s*", "", raw, flags=re.MULTILINE)
    # Remove URL-deleted dangling sentence fragments.
    raw = re.sub(r"자세한\s*메모는\s*를\s*참고해야\s*합니다\.?", " ", raw)
    raw = re.sub(r"자세히\s*보기\s*:?\s*", " ", raw)
    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    plain = " ".join(lines).strip()
    plain = convert_english_to_korean(plain)
    plain = remove_special_characters(plain)
    plain = re.sub(r"\s+", " ", plain).strip()
    return plain


def card_to_narration(card: dict[str, Any], idx: int) -> str:
    parts = [f"{idx}번째 카드입니다."]
    for key in ("header", "title", "bodyMd", "whyMd", "impactMd", "actionMd"):
        value = strip_markdown(card.get(key, ""))
        if value:
            parts.append(value)
    narration = " ".join(parts)
    narration = remove_special_characters(narration)
    narration = re.sub(r"\s+", " ", narration).strip()
    return narration


def resolve_model_path(qwen_dir: Path, model_folder: str) -> Path:
    model_root = qwen_dir / "models" / model_folder
    if not model_root.exists():
        raise FileNotFoundError(f"Model not found: {model_root}")

    snapshots_dir = model_root / "snapshots"
    if snapshots_dir.exists():
        snapshots = sorted(
            p for p in snapshots_dir.iterdir() if p.is_dir() and not p.name.startswith(".")
        )
        if snapshots:
            return snapshots[0]
    return model_root


def main() -> int:
    args = parse_args()
    input_path, out_dir = resolve_paths(args)

    if not input_path.exists():
        raise FileNotFoundError(f"Input markdown not found: {input_path}")

    markdown_text = input_path.read_text(encoding="utf-8")
    cards = parse_card_meta(markdown_text)
    if not cards:
        raise RuntimeError("No CARD meta blocks found in markdown input.")

    if args.limit > 0:
        cards = cards[: args.limit]

    narrations = []
    for idx, card in enumerate(cards, start=1):
        narrations.append(
            {
                "index": idx,
                "id": str(card.get("id", f"card-{idx:02d}")),
                "kind": str(card.get("kind", "")),
                "text": card_to_narration(card, idx),
                "wav": f"card-{idx:02d}.wav",
                "txt": f"card-{idx:02d}.txt",
            }
        )

    out_dir.mkdir(parents=True, exist_ok=True)
    for item in narrations:
        (out_dir / item["txt"]).write_text(item["text"] + "\n", encoding="utf-8")

    if not args.dry_run:
        try:
            from mlx_audio.tts.generate import generate_audio
            from mlx_audio.tts.utils import load_model
        except ImportError as exc:
            raise RuntimeError(
                "mlx_audio is unavailable. Use qwen3-tts-apple-silicon/.venv/bin/python."
            ) from exc

        model_path = resolve_model_path(Path(args.qwen_dir), args.model)
        print(f"Loading model: {model_path}")
        model = load_model(str(model_path))

        for item in narrations:
            wav_path = out_dir / item["wav"]
            tmp_dir = Path(tempfile.mkdtemp(prefix="qwen_cards_"))
            try:
                kwargs: dict[str, Any] = {
                    "model": model,
                    "text": item["text"],
                    "output_path": str(tmp_dir),
                    "speed": args.speed,
                    "lang_code": args.lang,
                    "verbose": False,
                }
                if args.speaker:
                    kwargs["voice"] = args.speaker
                if args.instruct:
                    kwargs["instruct"] = args.instruct
                generate_audio(**kwargs)

                tmp_wav = tmp_dir / "audio_000.wav"
                if not tmp_wav.exists():
                    raise RuntimeError(f"No generated audio file for card {item['index']}")
                shutil.move(str(tmp_wav), wav_path)
                print(f"[{item['index']:02d}/{len(narrations):02d}] {wav_path}")
            finally:
                shutil.rmtree(tmp_dir, ignore_errors=True)

    manifest = {
        "month": args.month,
        "input": str(input_path),
        "outputDir": str(out_dir),
        "model": args.model,
        "speaker": args.speaker,
        "instruct": args.instruct,
        "speed": args.speed,
        "lang": args.lang,
        "count": len(narrations),
        "dryRun": args.dry_run,
        "items": narrations,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Done: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
