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
  createCanvas(1000, 3800);

  // data is now an array of { country, years: [...] }
  for (const entry of data) {
    let c = new Node(entry.country, entry.years);
    countries.push(c);
  }
  for (const key of Object.keys(params)) {
    gui.add(params, key, 0, 10, 1).onChange(onParamsChange);
  }
  onParamsChange(); // Initialize closest years for all countries
}

function draw() {
  background(0);

  let topMargin = 100; // Top margin
  let gutter = 110; // Vertical spacing between rectangles

  // Fixed positions for 4 columns (centered on canvas)
  let columnPositions = [650];
  let posY = topMargin;
  let column = 0;
  let posX = columnPositions[column];

  // Filter to only countries with matching years
  const matchingCountries = countries.filter(
    (country) => country.closest && country.closest.year !== null,
  );

  if (matchingCountries.length === 0) {
    fill(200);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("No countries match these parameters", width / 2, 200);
    return;
  }

  // Position matching countries tightly together
  for (let i = 0; i < matchingCountries.length; i++) {
    const country = matchingCountries[i];
    country.setPosition(posX, posY);
    country.render(ALL_YEARS);
    posY += gutter;
  }
}

function onParamsChange() {
  countries.forEach((node) => {
    node.findMatchingYear(params);
  });
}
