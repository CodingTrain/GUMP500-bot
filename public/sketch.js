function setup() {
  noCanvas();
  visualize();
}

async function visualize() {
  // Get all runners as json
  const response = await fetch("/api");
  const runners = await response.json();
  console.log(runners);
  // Sort runners from highest total to lowest
  runners.sort((a, b) => b.total - a.total);
  // Create a new div for each runner, containing their name and
  // total distance ran
  for (let runner of runners) {
    createDiv(`${runner.name} ran a total of ${runner.total} miles.`);
  }
}
