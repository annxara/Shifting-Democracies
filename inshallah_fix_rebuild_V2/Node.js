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
  render(allYears) {
    if (!this.closest) return;

    push();
    translate(this.pos.x, this.pos.y);
    
    let rectWidth = 400; // rectangle width
    let rectHeight = 80; // rectangle height
    
    // Create a map of year to data for quick lookup
    const yearMap = {};
    for (const yearData of this.years) {
      yearMap[yearData.year] = yearData;
    }

    const lineW = rectWidth * 0.99; // scale to rectangle width
    const lineH = rectHeight * 0.95; // scale to rectangle height
    const startX = -lineW / 2;
    const startY = -lineH / 2;
    const sectionWidth = lineW / allYears.length;
    
    // Find the index of the highlighted year
    let highlightedYearIndex = allYears.indexOf(this.closest.year);
    
    // Calculate offset to center the highlighted year
    let offsetX = -(highlightedYearIndex * sectionWidth + sectionWidth / 2);
    
    // Apply the offset to shift the content
    push();
    translate(offsetX, 0);
    
    rect(-rectWidth / 2, -rectHeight / 2, rectWidth, rectHeight);

    fill(255);
    textAlign(CENTER);
    textSize(10);
    text(this.country, -25, 52.5);
    text(this.closest.year, 63, 52.5);

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
      "rosa", // v2x_libdem
      "cornflowerblue", // v2x_egaldem
      "green", // v2x_delibdem
      "violet", // v2x_partipdem
      "red", // stfdem
    ];

    // Draw grey background for missing years
    fill(200);
    noStroke();
    for (let i = 0; i < allYears.length; i++) {
      const year = allYears[i];
      if (!yearMap[year]) {
        const x = startX + i * sectionWidth;
        rect(x, startY, sectionWidth, lineH);
      }
    }

    // Draw light yellow background for highlighted year
    fill(255, 255, 150);
    noStroke();
    for (let i = 0; i < allYears.length; i++) {
      const year = allYears[i];
      if (year === this.closest.year) {
        const x = startX + i * sectionWidth;
        rect(x, startY, sectionWidth, lineH);
      }
    }

    // Draw data visualization for each variable
    noFill();
    for (let vi = 0; vi < vdemKeys.length; vi++) {
      const key = vdemKeys[vi];
      stroke(vdemColors[vi]);
      strokeWeight(1);

      // Draw lines connecting data points
      beginShape();
      for (let i = 0; i < allYears.length; i++) {
        const year = allYears[i];
        const details = yearMap[year];
        if (!details || details[key] === undefined) continue;
        const x = startX + (i + 0.5) * sectionWidth;
        const normalizedValue = this.normalizeValue(key, details[key]);
        const y = map(normalizedValue, 0, 1, startY + lineH, startY);
        vertex(x, y);
      }
      endShape();
    }

    // Draw colored data points for each variable in each year
    for (let vi = 0; vi < vdemKeys.length; vi++) {
      const key = vdemKeys[vi];
      fill(vdemColors[vi]);
      noStroke();

      for (let i = 0; i < allYears.length; i++) {
        const year = allYears[i];
        const details = yearMap[year];
        if (!details || details[key] === undefined) continue;
        const x = startX + (i + 0.5) * sectionWidth;
        const normalizedValue = this.normalizeValue(key, details[key]);
        const y = map(normalizedValue, 0, 1, startY + lineH, startY);
        circle(x, y, 4);
      }
    }

    // Draw year indicator dots
    for (let i = 0; i < allYears.length; i++) {
      const year = allYears[i];
      const x = startX + (i + 0.5) * sectionWidth;

      if (year === this.closest.year) {
        fill(0);
      } else {
        fill(180);
      }
      noStroke();
      rect(x - 1, startY + lineH - 4 - 1, 2, 2);
    }

    // Draw vertical dividers between years (equally spaced)
    stroke(0);
    strokeWeight(0.5);
    for (let i = 1; i < allYears.length; i++) {
      const x = startX + i * sectionWidth;
      line(x, startY, x, startY + lineH);
    }

    pop(); // Close the offset translate
    pop(); // Close the main translate
  }

  setPosition(x, y) {
    this.pos.set(x, y);
  }
}
