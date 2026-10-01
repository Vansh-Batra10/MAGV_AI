import pytest

from receptionist.engine.language import detect


@pytest.mark.parametrize(
    "text",
    [
        "Hola, mi aire acondicionado no funciona",
        "Necesito un técnico por favor",
        "¿Habla español?",
        "Buenas tardes, tengo un problema con el aire",
        "no enfria la casa y hace mucho calor",
    ],
)
def test_spanish_detected(text: str) -> None:
    assert detect(text).language == "es"


@pytest.mark.parametrize(
    "text",
    [
        "Hi, this is Jose Garcia, my AC is out",
        "Gracias, that works for me",
        "Si, that's right",
        "My address is 12 Casa Grande Drive in Round Rock",
        "Hola! My heater is broken",
        "Can you speak English please",
        "",
    ],
)
def test_english_not_misrouted(text: str) -> None:
    assert detect(text).language == "en"
