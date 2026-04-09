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
  createCanvas(3840, 2160);

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
  const topMargin = 100;
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

function draw() {
  background(0);

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

  // Draw faint vertical lines at positions of matching countries
  stroke(100, 100); // More visible faint lines
  strokeWeight(1);
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    // Check if country has a matching year
    let hasMatch = false;
    for (const yearData of country.years) {
      if (country.yearMatchesParams(yearData, params)) {
        hasMatch = true;
        break;
      }
    }
    if (hasMatch) {
      line(country.pos.x, 0, country.pos.x, height);
    }
  }

  // Render all countries (they have fixed positions)
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    country.render(ALL_YEARS, params, hasAnyMatch);
  }
}

function onParamsChange() {
  countries.forEach((node) => {
    node.findMatchingYear(params);
  });

  console.log(
    `Params: stfeco=${params.stfeco}, stflife=${params.stflife}, stfgov=${params.stfgov}`,
  );
}
