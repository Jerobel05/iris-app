from typing import List, Optional
from models.schemas import SuggestionVariant
from config import settings


STYLES = [
    {"style": "amical", "tone": "friendly and warm", "greeting": "Bonjour", "sign": "Cordialement"},
    {"style": "formel", "tone": "formal and professional", "greeting": "Monsieur/Madame", "sign": "Veuillez agréer mes salutations distinguées"},
    {"style": "bref", "tone": "brief and concise", "greeting": "Bonjour", "sign": "Bonne journée"},
]


def _generate_mock_variant(style_cfg: dict, email_subject: str, slot_info: str) -> SuggestionVariant:
    style = style_cfg["style"]
    greeting = style_cfg["greeting"]
    sign = style_cfg["sign"]

    if style == "amical":
        body = (
            f"{greeting},\n\n"
            f"Merci pour votre message concernant \"{email_subject}\".\n\n"
            f"Je serais ravi(e) de vous rencontrer. {slot_info}\n\n"
            f"N'hésitez pas à me confirmer votre disponibilité.\n\n"
            f"{sign}"
        )
    elif style == "formel":
        body = (
            f"{greeting},\n\n"
            f"Suite à votre courriel relatif à \"{email_subject}\", "
            f"je vous confirme ma disponibilité pour cette réunion.\n\n"
            f"{slot_info}\n\n"
            f"Je reste à votre disposition pour tout renseignement complémentaire.\n\n"
            f"{sign}"
        )
    else:
        body = (
            f"{greeting},\n\n"
            f"Reçu pour \"{email_subject}\". {slot_info}\n\n"
            f"{sign}"
        )

    return SuggestionVariant(
        style=style,
        subject=f"Re: {email_subject}",
        body=body,
    )


def _generate_gpt_variant(style_cfg: dict, email_subject: str, email_body: str, slot_info: str) -> SuggestionVariant:
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = (
            f"Write a {style_cfg['tone']} email reply in French to an email with subject: '{email_subject}'.\n"
            f"Context: {email_body[:500]}\n"
            f"Proposed meeting time: {slot_info}\n"
            f"Keep the reply concise and natural."
        )
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        body = response.choices[0].message.content.strip()
        return SuggestionVariant(
            style=style_cfg["style"],
            subject=f"Re: {email_subject}",
            body=body,
        )
    except Exception:
        return _generate_mock_variant(style_cfg, email_subject, slot_info)


def generate_suggestions(
    email_subject: str,
    email_body: str = "",
    best_slot: Optional[str] = None,
) -> List[SuggestionVariant]:
    slot_info = f"Le créneau proposé est : {best_slot}." if best_slot else "Merci de me proposer un créneau."
    use_gpt = bool(settings.OPENAI_API_KEY)
    variants = []
    for style_cfg in STYLES:
        if use_gpt:
            variant = _generate_gpt_variant(style_cfg, email_subject, email_body, slot_info)
        else:
            variant = _generate_mock_variant(style_cfg, email_subject, slot_info)
        variants.append(variant)
    return variants
