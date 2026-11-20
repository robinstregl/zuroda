# Zuroda — brand manuál

Zuroda je hra o poutníkovi a robopsovi Zurovi ve vyschlé poušti. Tón: naděje, klid, humor robotů, žádná depka. Studio: Vabiko. Hra je anglicky, tenhle manuál je česky.

Tohle je **aktuální stav** (20. 11. 2026) a ke každé slabině **návrh**. Vybrané návrhy se pak propíšou do hry i sem.

## Hlavní princip: dva světy

1. **Svět = světlá poušť.** Teplý písek (`sand`, `sand-lit`), terakotové střechy (`terra`), zelená oáza (`oasis`), moře (`sea-shallow`, `sea-deep`). Je to světlé, teplé a málo kontrastní.
2. **UI = Zurův displej.** Všechno, co hráč čte nebo mačká, leží na tmavém displeji (`night`) se světlým rámečkem (`frame`) a jantarovým textem (`amber`). Tmavý displej je na písku vidět vždy (9,5 : 1).

Pravidlo, které z toho plyne: **na písek nekreslit nic světlého ani teplého, co se má mačkat.** Takové prvky s pouští splývají. To je přesně problém tlačítka „Fill up & go“.

## Barvy podle situace

| Situace | Pozadí | Text / prvek | Kontrast |
|---|---|---|---|
| Horní bar, panely, bubliny, mapa | `night` | `amber` | 13,9 : 1 |
| Vedlejší text, popisky v kapitálkách | `night` | `amber-dim` | 6,1 : 1 |
| Voda (čísla, pruh) | `night` | `water` | 11,6 : 1 |
| Zlatý šrot | `night` | `gold` | 12,2 : 1 |
| Varování (málo vody, chybí materiál) | `night` | `ember` | 8,3 : 1 |
| Hlavní tlačítko „Fill up & go“ | `terra` na `sand-lit` | světlý text | **tlačítko 2,2 : 1 vůči písku ✗**, text 3,7 : 1 ✗ |
| Akční tlačítko (Dismantle, Build camp) | `act` na `sand-lit` | `ink` | **tlačítko 1,1 : 1 vůči písku ✗**, text 8,2 : 1 |
| Jména budov ve vesnici | `paper` pilulka | `ink` | 11,1 : 1, ale jiný styl než zbytek UI |
| Vedlejší tlačítka v panelech | průhledné na `night` | `amber` | v pořádku |

Prvek, který se má mačkat, potřebuje aspoň 3 : 1 vůči okolí a text aspoň 4,5 : 1 (WCAG). Terakotové i žluté tlačítko na písku tohle nesplňují.

## Typografie

Jedno písmo: **Jost** (volná náhrada Futury, licence SIL OFL, přibalené ve hře). Geometrické, kulaté, přátelské. Kapitálky s prostrkáním jsou na „technické“ popisky displeje.

- **Logo**: `logo` 70 px, 700, prostrkání 0,14 em, kapitálky, `amber` se září.
- **Podtitul**: `tagline` 19 px kurzíva.
- **Titulek panelu**: `sheet-title` 23 px 600.
- **Čísla v horním baru**: `hud-value` 16 px 700, tabulkové číslice.
- **Tlačítka**: `button` 16 px 600 (hlavní 17 px), druhý řádek `caption` 11,5 px 500.
- **Text**: `body` 14 px. Popisky `label-caps` 11 px kapitálky v `amber-dim`.
- **Ve světě**: jména budov `world-label` 10,5 px 600, řádek „walked“ 10,5 px 500.

## Tvary a rozměry

- Panely displeje: rádius `radius-lg` (22 px) a 3px rámeček `frame`.
- Bubliny a hlášky: `radius-md` (18 px). Bublina má jeden roh 4 px, směrem k Zurovi.
- Tlačítka: vždy pilulka (`radius-pill`), kulatá tlačítka jsou kruhy.
- Odsazení: 4 / 8 / 12 / 16 / 20 px (`space-1` až `space-5`).

## Ikony

Vlastní sada SVG ikon (icons.js), žádné emoji. Kreslí se plnou barvou s tmavým obrysem. Na displeji mají jemnou jantarovou záři, aby seděly k textu.

## Návrhy zlepšení

Podrobně v sekci **Návrhy** a v náhledech komponent ve skupině „Návrhy“. Stručně:

1. **Hlavní tlačítko na poušti** (problém, který jsi viděl). Doporučuju **A · Noční tlačítko**: tmavý displej, jantarový text, světlý rámeček. Na písku má 9,5 : 1 a je jednotné se zbytkem UI. Alternativy:
   - **B · Vodní tyrkys** (`proposal-water-deep`): barevně vyčnívá, protože tyrkys je opak oranžové pouště, a významem sedí k vodě, hlavní měně hry. Na písku má jen 3,2 : 1.
   - **C · Tmavá terakota** (`proposal-terra-deep`): zachová teplý brand, ale vyčnívá nejméně.
2. **Akční tlačítko** (Dismantle, Build camp) převést stejně na noční, se zlatým rámečkem a zlatým textem. Dnes je s pískem skoro totožné (1,1 : 1).
3. **Jména budov** převést z krémových pilulek na malé noční pilulky. Ve vesnici by pak všechno UI mluvilo jedním jazykem.
4. **Role terakoty**: jen brand akcent (střechy, logo, zvýraznění). Ne jako výplň tlačítek na písku.
5. **Jedna akční barva**: buď jantar/zlato (A), nebo voda (B). Neplést obě.
