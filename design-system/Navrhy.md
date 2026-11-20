# Návrhy

Měřeno proti písku tak, jak se ve hře vykreslí (`sand-lit` #e7b878, změřeno z tvého screenshotu). Prvek, který se má mačkat, potřebuje aspoň 3 : 1 vůči okolí a text aspoň 4,5 : 1.

## 1. Hlavní tlačítko („Fill up & go“, „Back home“)

| Varianta | Výplň | Text | Vůči písku | Text na výplni | Poznámka |
|---|---|---|---|---|---|
| Dnes | `terra` #c8643c | #fff7ea | 2,2 : 1 ✗ | 3,7 : 1 ✗ | Splývá s pouští a střechami. |
| **A · Noční (doporučeno)** | `night` #1d1a18 + rámeček `frame` | `amber` | **9,5 : 1** | **13,9 : 1** | Stejný jazyk jako horní bar a panely. Akcent: tenká zlatá linka nebo ikona vody v `water`. |
| B · Vodní tyrkys | `proposal-water-deep` #1f6f7c + rámeček `frame` | `amber` | 3,2 : 1 | 4,6 : 1 | Barevně vyčnívá nejvíc a znamená „voda“. Musí mít rámeček a stín. |
| C · Tmavá terakota | `proposal-terra-deep` #9c3f22 + tmavý stín | #fff7ea | 3,7 : 1 | 6,3 : 1 | Zachová teplý brand, ale tónem je pořád blízko písku. |

Proč doporučuju A: hráč se naučí jedno pravidlo, totiž že tmavé = UI, které se dá ovládat. Tmavé tlačítko na světlé poušti je nejčitelnější i na slunci na telefonu. A celé UI pak působí jako jedno zařízení, Zurův displej.

## 2. Akční tlačítko na výpravě (Dismantle, Build camp)

Dnes žlutá `act` #f2c14e na písku: 1,1 : 1, tedy skoro neviditelná hrana. Návrh: noční pilulka s rámečkem a textem v `gold` (12,2 : 1), případně pulzující zlatá záře, když jde akce provést.

## 3. Jména budov ve vesnici

Dnes krémová průsvitná pilulka a hnědý text, starý „papírový“ styl. Návrh: malá noční pilulka (`night`, text `amber`, 10,5 px 600), ceny v `amber-dim`, cena, na kterou už máš, v `gold`.

## 4. Pravidla barev (návrh)

- `night` je povrch všeho ovladatelného.
- `amber` je text, `amber-dim` vedlejší text.
- `water`, `gold`, `ember` jen pro jejich význam (voda, zlatý šrot, varování), nikdy jako dekorace.
- `terra` je brand akcent: logo, střechy, zvýraznění na tmavém pozadí (4,4 : 1, takže jen pro velký text nebo ikony). Ne jako tlačítko na písku.
- Ve světě nikdy světlý ovládací prvek.

## Co dál

Vyber A, B nebo C (případně kombinaci). Propíšu to do hry: hlavní a akční tlačítka, jména budov a tokeny tady v manuálu.
