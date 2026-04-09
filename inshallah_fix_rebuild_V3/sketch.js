// GUI
let data;
let countries = [];
//let sortedCountries = [];
const ALL_YEARS = [
  2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2023,
];

const gui = new lil.GUI();
const params = {
  //: 5,
  stfeco: 5,
  //stfedu: 5,
  //stfhlth: 5,
  stflife: 5,
  //trstprl: 5,
  stfgov: 5,
};

function preload() {
  loadJSON("ess_vdem_country_year_variables 2.json", (d) => {
    data = d;
  });
}

function setup() {
  createCanvas(1920, 1080);

  // data is now an array of { country, years: [...] }
  for (const entry of data) {
    let c = new Node(entry.country, entry.years);
    countries.push(c);
  }

  console.log(`Loaded ${countries.length} countries`);

  // Assign fixed positions to all countries in 3 columns
  const numCols = 3;
  const countriesPerCol = Math.ceil(countries.length / numCols);
  const colWidth = width / numCols;
  const topMargin = 50;
  const verticalGap = (height - topMargin * 2) / countriesPerCol;

  console.log(
    `Countries per column: ${countriesPerCol}, Column width: ${colWidth}, Vertical gap: ${verticalGap}`,
  );

  for (let i = 0; i < countries.length; i++) {
    const col = Math.floor(i / countriesPerCol);
    const row = i % countriesPerCol;
    const posX = colWidth * col + colWidth / 2;
    const posY = topMargin + row * verticalGap;
    countries[i].setPosition(posX, posY);
    console.log(
      `${countries[i].country}: col=${col}, row=${row}, pos=(${posX}, ${posY})`,
    );
  }

  for (const key of Object.keys(params)) {
    gui.add(params, key, 0, 10, 1).onChange(onParamsChange);
  }
  onParamsChange(); // Initialize closest years for all countries
}

function onParamsChange() {
  countries.forEach((node) => {
    node.findMatchingYear(params);
  });

  console.log(
    `Params: stfeco=${params.stfeco}, stflife=${params.stflife}, stfgov=${params.stfgov}`,
  );
}

function draw() {
  background(0);

  // Draw 3 simple vertical guide lines at column centers
  stroke(255, 100);
  strokeWeight(2);
  const numCols = 3;
  const colWidth = width / numCols;
  for (let col = 0; col < numCols; col++) {
    const centerX = colWidth * col + colWidth / 2;
    line(centerX, 0, centerX, height);
  }

  // Check if any country has a matching year
  let hasAnyMatch = false;
  for (let i = 0; i < countries.length; i++) {
    for (const yearData of countries[i].years) {
      if (countries[i].yearMatchesParams(yearData, params)) {
        hasAnyMatch = true;
        break;
      }
    }
    if (hasAnyMatch) break;
  }

  // Draw each country
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    country.render(ALL_YEARS, params, hasAnyMatch);
  }

  // Draw legend in top right corner
  drawLegend();
}

function drawLegend() {
  const legendX = width - 440;
  const legendY = height - 225;
  const legendW = 240;
  const legendH = 165;

  // Background box
  fill(30);
  stroke(150);
  strokeWeight(2);
  rect(legendX, legendY, legendW, legendH, 10);

  // Title
  fill(255);
  textAlign(LEFT);
  textSize(13);
  textStyle(BOLD);
  text("Legende", legendX + 8, legendY + 13);

  // Example rectangle with divisions and colors
  const exampleX = legendX + 8;
  const exampleY = legendY + 18;
  const exampleW = 175;
  const exampleH = 20;
  const sectionW = exampleW / 5; // Show 5 sections as example

  // Draw sections
  fill(170); // Missing year - gray
  rect(exampleX, exampleY, sectionW, exampleH, 5, 0, 0, 5);

  fill(255); // Matching - white
  rect(exampleX + sectionW, exampleY, sectionW, exampleH);

  fill(255); // Matching - white
  rect(exampleX + sectionW * 2, exampleY, sectionW, exampleH);

  fill(255, 255, 150, 255); // Matching highlight - yellow
  rect(exampleX + sectionW * 3, exampleY, sectionW, exampleH);

  fill(170); // Missing year - gray
  rect(exampleX + sectionW * 4, exampleY, sectionW, exampleH, 0, 5, 5, 0);

  // Draw sample data line across sections
  stroke(255, 100, 100);
  strokeWeight(1);
  line(
    exampleX + sectionW * 0.5,
    exampleY + 15,
    exampleX + sectionW * 4.5,
    exampleY + 5,
  );

  // Draw dividers
  stroke(0);
  strokeWeight(0.5);
  for (let i = 1; i < 5; i++) {
    line(
      exampleX + sectionW * i,
      exampleY,
      exampleX + sectionW * i,
      exampleY + exampleH,
    );
  }

  // Legend text
  fill(200);
  textSize(6);
  textStyle(NORMAL);
  text(
    "1 Block = Year |Yellow = Matching Params | Gray = Missing ",
    legendX + 8,
    exampleY + exampleH + 10,
  );

  // Draw colored circles for data dimensions
  const vdemLabels = [
    "v2x_polyarchy",
    "v2x_libdem",
    "v2x_egaldem",
    "v2x_delibdem",
    "v2x_partipdem",
    "stfdem",
  ];
  const vdemColors = [
    "orange",
    "blue",
    "cornflowerblue",
    "green",
    "violet",
    "red",
  ];

  const circleRadius = 3;
  const circleSpacing = 18;

  for (let i = 0; i < vdemLabels.length; i++) {
    const circleX = legendX + 8;
    const circleY = legendY + 8 + exampleH + 30 + i * circleSpacing;

    // Draw circle
    fill(vdemColors[i]);
    noStroke();
    circle(circleX, circleY, circleRadius * 2);

    // Draw label
    fill(150);
    textAlign(LEFT);
    textSize(5);
    textStyle(NORMAL);
    text(vdemLabels[i], circleX + 6, circleY + 2);
  }
}
