let gui;
let dataRaw;
let rows = [];
let ranges = {};

const controls = {
  vertrauen: 5, // 5 weil das der Mittelwert ist
  wirtschaft: 5,
  bildung: 5,
  partizipation: 5,
  healthSystem: 5,
  topN: 25, // 25 weil das die Anzahl der Länder ist. TopN = Anzahl der Länder, die gezeigt werden sollten.
};

const configuration = [
  { id: "vertrauen", min: 0, max: 10, step: 1 },
  { id: "wirtschaft", min: 0, max: 10, step: 1 },
  { id: "bildung", min: 0, max: 10, step: 1 },
  { id: "partizipation", min: 0, max: 10, step: 1 },
  { id: "healthSystem", min: 0, max: 10, step: 1 },

];

function preload() {
  dataRaw = loadJSON("dataset/ess_vdem_country_year_variables.json");
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  rows = flattenData(dataRaw); // Wandelt die verschachtelte JSON-Struktur in ein flaches Array von Objekten um, die leichter zu verarbeiten sind
  ranges = computeRanges(rows); // Berechnet die Min- und Max-Werte für jede Variable, um die Normalisierung zu ermöglichen
  /*
  const pMin = Math.floor(ranges.partizipation.min);
  const pMax = Math.ceil(ranges.partizipation.max);
  controls.partizipation = Math.round((pMin + pMax) / 2);
  */
  setupGUI();
}

function draw() {
  background(220);

  const ranked = rankByDistance(rows, controls, ranges);
  const top = ranked.slice(0, controls.topN);

  drawBubbles(top); // Zeichnet die Blasen für die Top N Länder basierend auf den aktuellen GUI-Einstellungen
  drawTopInfo(ranked);
  drawDetailPanel(ranked[0]); // Zeigt die Details des besten Matches an
}

//const gui = new lil.GUI();

function setupGUI() {
  gui = new lil.GUI();

  gui.add(controls, 'vertrauen', 0, 10, 1).name('Vertrauen');
  gui.add(controls, 'wirtschaft', 0, 10, 1).name('Wirtschaft');
  gui.add(controls, 'bildung', 0, 10, 1).name('Bildung');

  //gui.add(controls, 'partizipation', 0, 10, 1).name('Partizipation');
  gui.add(
    controls,
    'partizipation',
    Math.floor(ranges.partizipation.min),
    Math.ceil(ranges.partizipation.max),
    1
  ).name('Partizipation');

  gui.add(controls, 'healthSystem', 0, 10, 1).name('Gesundheitssystem');
  gui.add(controls, 'topN', 1, rows.length, 1).name('Anzahl Länder');
}



// +++++++ Datenvorbereitung +++++++

function flattenData(obj) {
  const out = []; // Leeres Array, um die flachen Objekte zu speichern

  for (const country of Object.keys(obj)) { // Iteriert über jedes Land im JSON-Objekt
    const years = obj[country]; // Holt die Jahresdaten für das aktuelle Land

    for (const year of Object.keys(years)) {
      const v = years[year]; // Holt die Variablenwerte für das aktuelle Jahr

      const item = { // <- wichtig: "=" nach item, weil es ein neues Objekt erstellt, das die Informationen für das aktuelle Land und Jahr enthält
        country: country,
        year: year,
        code: country.slice(0, 3).toUpperCase(), // Erstellt einen Ländercode aus den ersten drei Buchstaben des Ländernamens
        metrics: {
          vertrauen: v.trstprl,
          wirtschaft: v.stfeco,
          bildung: v.stfedu,
          partizipation: v.vote,
          healthSystem: v.stfhlth
        },
        details: {
          stflife: v.stflife,
          stfdem: v.stfdem,
          v2x_libdem: v.v2x_libdem,
          v2x_polyarchy: v.v2x_polyarchy,
          v2x_partipdem: v.v2x_partipdem,
          v2x_delibdem: v.v2x_delibdem,
          v2x_egaldem: v.v2x_egaldem
        }
      };

      const complete = // Überprüft, ob alle benötigten Metriken vorhanden und gültig sind
        Number.isFinite(item.metrics.vertrauen) &&
        Number.isFinite(item.metrics.wirtschaft) &&
        Number.isFinite(item.metrics.bildung) &&
        Number.isFinite(item.metrics.partizipation) &&
        Number.isFinite(item.metrics.healthSystem);

      if (complete) out.push(item); // Fügt das Objekt nur hinzu, wenn alle Metriken gültig sind
    }
  }

  return out; // Gibt das Array mit den flachen Objekten zurück
}



// +++++++ Hilfsfunktionen +++++++
// Diese Funktion berechnet die Min- und Max-Werte für jede Metrik, um die Normalisierung zu ermöglichen

function computeRanges(items) {
  const keys = ["vertrauen", "wirtschaft", "bildung", "partizipation", "healthSystem"];
  const out = {};

  for (const key of keys) { // Iteriert über jede Metrik, um die Min- und Max-Werte zu berechnen
    let min = Infinity;
    let max = -Infinity;

    for (const item of items) {
      const val = item.metrics[key];
      min = Math.min(min, val);
      max = Math.max(max, val);
    }
    out[key] = { min: min, max: max }; // Speichert die Min- und Max-Werte für die aktuelle Metrik
  }
  return out; // Gibt das Objekt mit den Min- und Max-Werten zurück
}

console.log(rows.length, ranges);




// +++++++ Kernfunktion ++++++
// Diese Funktion berechnet die Distanz jedes Landes zu den Zielwerten, die in den GUI-Steuerelementen festgelegt sind, und sortiert die Länder basierend auf dieser Distanz

function rankByDistance(items, target, dataRanges) {
  const keys = ["vertrauen", "wirtschaft", "bildung", "partizipation", "healthSystem"];

  return items
    .map(item => {
      let sumAbs = 0;
      let sumSigned = 0;
      let n = 0;

      for (const key of keys) {
        const val = item.metrics[key];
        const r = dataRanges[key];

        //Schutz, falls Range fehlt
        if (!r) continue;

        //Normalisierung: sonst dominiert "partizipation" wegen grösserer Zahlen.
        const denom = Math.max(r.max - r.min, 1e-9); // Verhindert Division durch Null

        const signed = (val - target[key]) / denom; // Berechnet die normalisierte Differenz mit Vorzeichen
        const absDiff = Math.abs(signed); // Berechnet die absolute Differenz

        sumAbs += absDiff; // Akkumuliert die absolute Differenz
        sumSigned += signed;
        n += 1; // Zählt die Anzahl der Metriken, die verglichen wurden
      }

      const distance = n > 0 ? sumAbs / n : Infinity; // Berechnet die durchschnittliche absolute Differenz als Distanz
      const similarity = n > 0 ? 1 - constrain(distance, 0, 1) : 0;
      const bias = n > 0 ? sumSigned / n : 0; // Berechnet den durchschnittlichen Bias, um die Richtung der Abweichung zu verstehen

      return {
        ...item,
        distance: distance,
        similarity: similarity,
        bias: bias
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sortiert die Items basierend auf der berechneten Distanz
}

/*
function drawTopInfo(top) {
  if (!top) return; // falls noch kein ergebnis da ist

  noStroke();
  fill(20);
  textAlign(LEFT, TOP);
  textSize(14);

  const pct = nf(top.similarity * 100, 1, 1);

  text(
    "Top Match: " + top.country + " (" + top.year + ") | " + pct + "%",
    20,
    20
  );

}*/

function drawTopInfo(ranked) {

  if (!ranked) return;
  const list = Array.isArray(ranked) ? ranked : [ranked];

  noStroke();
  fill(20);
  textAlign(LEFT, TOP);
  textSize(14);

  text("Top 3 Matches:", 20, 20);

  for (let i = 0; i < Math.min(3, list.length); i++) {
    const r = list[i];
    const pct = nf(r.similarity * 100, 1, 1);
    const line = (i + 1) + ". " + r.country + " (" + r.year + ") | " + pct + "%";
    text(line, 20, 45 + i * 20);

  }
}





function drawBubbles(items) {
  if (!items || items.length === 0) return;

  const cx = width * 0.5;
  const cy = height * 0.58; // leicht nach unten verschoben, damit die Top-Info Platz hat
  textAlign(CENTER, CENTER);

  for (let i = 0; i < items.length; i++) {
    const it = items[i]; // Aktuelles Land-Objekt. it = item

    //einfache spirale position
    const angle = i * 0.8;
    const radius = 20 + Math.sqrt(i) * 35; // Abstand von der Mitte basierend auf der Position in der Liste
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    //grösse basiert auf similarity (0..1)
    const d = map(it.similarity, 0, 1, 10, 50);


    /*
    //bester match gelb, rest grau
    if (i === 0) {
      fill(235, 210, 70);
    }
    else {
      // bias typischerweise ca. -1 bis +1
      // negativ = dunkler, positiv = heller
      const gray = map(it.bias, -1, 1, 80, 210);
      fill(gray);
    }*/

    if (i === 0) {
      fill(235, 210, 70);      // Top 1: kräftig gelb
    } else if (i < 3) {
      fill(245, 228, 140);     // Top 2-3: hellgelb
    } else {
      const gray = map(it.bias, -1, 1, 80, 210);
      fill(gray);              // Rest: Graustufe nach Bias
    }


    stroke(40, 90);
    strokeWeight(1);
    circle(x, y, d);

    noStroke();
    fill(20);
    textSize(Math.max(10, d * 0.16)); //textgrösse basiert auf Durchmesser
    text(it.code + "\n" + it.year, x, y); // Zeigt den Ländercode und das Jahr in der Blase an

  }
}


// !!!AI generiert: noch kontrollieren!!!

function drawDetailPanel(top) {
  if (!top) return;

  const panelX = width * 0.62;
  const panelY = 20;
  const panelW = width * 0.34;
  const panelH = height - 40;

  // einfacher Hintergrund
  noStroke();
  fill(245,245,245,200);
  rect(panelX, panelY, panelW, panelH, 8);

  fill(20);
  textAlign(LEFT, TOP);

  // Titel
  textSize(16);
  text("Detailansicht (Top Match)", panelX + 12, panelY + 12);

  textSize(14);
  text(top.country + " (" + top.year + ")", panelX + 12, panelY + 38);

  // Werte
  const d = top.details || {};
  const lines = [
    "stflife: " + formatNum(d.stflife),
    "stfdem: " + formatNum(d.stfdem),
    "v2x_libdem: " + formatNum(d.v2x_libdem),
    "v2x_polyarchy: " + formatNum(d.v2x_polyarchy),
    "v2x_partipdem: " + formatNum(d.v2x_partipdem),
    "v2x_delibdem: " + formatNum(d.v2x_delibdem),
    "v2x_egaldem: " + formatNum(d.v2x_egaldem)
  ];

  let y = panelY + 70;
  for (const line of lines) {
    text(line, panelX + 12, y);
    y += 22;
  }

  // einfacher Vergleich subjektiv vs objektiv
  const cmp = compareSubjectiveObjective(top);
  y += 8;
  text("Subjektiv (0-10): " + formatNum(cmp.subjective), panelX + 12, y); y += 22;
  text("Objektiv (0-10): " + formatNum(cmp.objective), panelX + 12, y); y += 22;
  text("Gap: " + formatNum(cmp.gap), panelX + 12, y); y += 22;

  let interpretation = "Interpretation: neutral";
  if (cmp.gap > 0.5) interpretation = "Interpretation: subjektiv positiver";
  if (cmp.gap < -0.5) interpretation = "Interpretation: subjektiv negativer";
  text(interpretation, panelX + 12, y);
}

function compareSubjectiveObjective(top) {
  // subjektiv aus deinen 5 gewählten Variablen (bereits in metrics)
  const m = top.metrics;
  const subjective =
    (m.vertrauen + m.wirtschaft + m.bildung + m.healthSystem + normalizeVoteTo10(m.partizipation)) / 5;

  // objektiv aus v2x-Werten (0..1 -> 0..10)
  const d = top.details || {};
  const objValues = [
    d.v2x_libdem,
    d.v2x_polyarchy,
    d.v2x_partipdem,
    d.v2x_delibdem,
    d.v2x_egaldem
  ].filter(Number.isFinite);

  const objective = objValues.length > 0
    ? (objValues.reduce((a, b) => a + b, 0) / objValues.length) * 10
    : 0;

  return {
    subjective: subjective,
    objective: objective,
    gap: subjective - objective
  };
}

function normalizeVoteTo10(vote) {
  // simple Normalisierung aus bestehenden Ranges
  const r = ranges.partizipation;
  if (!r) return 0;
  const denom = Math.max(r.max - r.min, 1e-9);
  const norm01 = (vote - r.min) / denom;
  return constrain(norm01 * 10, 0, 10);
}

function formatNum(v) {
  if (!Number.isFinite(v)) return "-";
  return nf(v, 1, 2);
}