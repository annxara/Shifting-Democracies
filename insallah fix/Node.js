class Node {
  constructor(country, years) {
    this.country = country;
    this.years = years; // array of { year, v2x_polyarchy, ... }
    this.closest = null;
    this.pos = createVector(random(width), random(height));
    this.yearDistances = {}; // keyed by year
  }

  normalizeValue(key, value) {
    // Map different value systems to 0-1 scale
    if (key === "stfgov" || key === "stfdem") {
      // stfgov and stfdem are on 0-10 scale, normalize to 0-1
      return value / 10;
    }
    return value; // v2x_* variables already on 0-1 scale
  }

  calcDist(params) {
    let minDist = Infinity;
    let closestYear = null;
    let closestData = null;

    for (const details of this.years) {
      if (details.year === 2025) continue; // ← skip 2025

      const yr = details.year;
      let sumSquares = 0;
      for (const [key, value] of Object.entries(params)) {
        if (details[key] !== undefined) {
          const normalizedData = this.normalizeValue(key, details[key]);
          const normalizedParam = this.normalizeValue(key, value);
          sumSquares += (normalizedData - normalizedParam) ** 2;
        }
      }
      const dist = Math.sqrt(sumSquares);
      this.yearDistances[yr] = dist;

      if (dist < minDist) {
        minDist = dist;
        closestYear = yr;
        closestData = details;
        console.log(this.country, closestYear, minDist);
      }
    }

    this.closest = { year: closestYear, data: closestData, distance: minDist };
    return this.closest;
  }
  render() {
    if (!this.closest) return;

    push();
    translate(this.pos.x, this.pos.y);
    let d = 120; // static square size
    rect(-d / 2, -d / 2, d, d);

    fill(0);
    textAlign(CENTER);
    text(this.country, -20, 75);
    text(this.closest.year, 20, 75);

    const sortedYears = [...this.years].sort((a, b) => a.year - b.year);
    const lineW = 120;
    const lineH = 50;
    const startX = -lineW / 2;
    const startY = 0;

    const vdemKeys = [
      "v2x_polyarchy",
      "v2x_libdem",
      "v2x_egaldem",
      "v2x_delibdem",
      "v2x_partipdem",
      // "v2x_freexp_altinf",
      //"stfgov",
      "stfdem",
    ];
    const vdemColors = [
      "orange", // v2x_polyarchy
      "lightgreen", // v2x_libdem
      "cornflowerblue", // v2x_egaldem
      "green", // v2x_delibdem
      "violet", // v2x_partipdem
      "red", // stfgov
      "lol", // stfdem
      // 'black',
    ];

    noFill();
    for (let vi = 0; vi < vdemKeys.length; vi++) {
      const key = vdemKeys[vi];
      stroke(vdemColors[vi]);
      strokeWeight(1);
      beginShape();
      for (let i = 0; i < sortedYears.length; i++) {
        const details = sortedYears[i];
        if (details[key] === undefined) continue;
        const x = map(i, 0, sortedYears.length - 1, startX, startX + lineW);
        const normalizedValue = this.normalizeValue(key, details[key]);
        const y = map(normalizedValue, 0, 1, startY + lineH, startY);
        vertex(x, y);
      }
      endShape();
    }

    for (let i = 0; i < sortedYears.length; i++) {
      const details = sortedYears[i];
      const yr = details.year;
      const x = map(i, 0, sortedYears.length - 1, startX, startX + lineW);
      const dist = this.yearDistances[yr];

      const yabbrev = map(dist, 0, 15, 50, 0);

      if (yr === this.closest.year) {
        fill(0);
      } else {
        fill(180);
      }
      noStroke();
      rect(x - 2, startY + lineH + 8 - yabbrev - 2, 4, 4);
    }

    pop();
  }

  setPosition(x, y) {
    this.pos.set(x, y);
  }
}
