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
  for (const key of Object.keys(params)) {
    gui.add(params, key, 0, 10, 1).onChange(onParamsChange);
  }
  onParamsChange(); // Initialize closest years for all countries
}

function draw() {
  background(0);

  let margin = 90;
  let gutter = 90;
  let numColumns = 4;
  let availableWidth = width - margin * 2;
  let columnWidth = availableWidth / numColumns;
  let posX = margin + columnWidth / 2;
  let posY = margin;
  let column = 0;

  //for (const country of sortedCountries) {
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    country.setPosition(posX, posY);
    country.render(ALL_YEARS);
    posY += gutter;

    // Check if we need to move to next column
    if (posY > height - margin && column < numColumns - 1) {
      column++;
      posX = margin + columnWidth / 2 + columnWidth * column;
      posY = margin;
    }
  }
}

function onParamsChange() {
  // sortedCountries = countries
  //   .map((node) => {
  //     node.calcDist(params);
  //     return node;
  //   })
  //   .sort((a, b) => a.closest.distance - b.closest.distance);

  countries.forEach((node) => {
    node.calcDist(params);
  });
}
