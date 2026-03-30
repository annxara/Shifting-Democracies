// GUI
let data;
let countries = [];
let sortedCountries = [];

const gui = new lil.GUI();
const params = {
  stfdem: 5,
  stfeco: 5,
  stfedu: 5,
  stfhlth: 5,
  stflife: 5,
  trstprl: 5,
};

function preload() {
  loadJSON("ess_vdem_country_year_variables_restructured.json", (d) => {
    data = d;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // data is now an array of { country, years: [...] }
  for (const entry of data) {
    let c = new Node(entry.country, entry.years);
    countries.push(c);
  }
  for (const key of Object.keys(params)) {
    gui.add(params, key, 0, 10, 1).onChange(onParamsChange);
  }
}

function draw() {
  background(220);

  let gutter = 150;
  let posX = gutter;
  let posY = gutter;

  for (const country of sortedCountries) {
    //country.setPosition(posX, posY);
    country.render();
    posX += gutter;
    if (posX > width - gutter) {
      posX = gutter;
      posY += gutter;
    }
  }
}

function onParamsChange() {
  sortedCountries = countries
    .map((node) => {
      node.calcDist(params);
      return node;
    })
    .sort((a, b) => a.closest.distance - b.closest.distance);
}
