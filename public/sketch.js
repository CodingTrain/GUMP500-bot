function setup() {
  noCanvas();
  visualize();
}

async function visualize() {
  const response = await fetch("/api");
  const runners = await response.json();
  console.log(runners);
  runners.sort((a, b) => a.total - b.total);
  for (let runner of runners) {
    createDiv(`${runner.name} ran a total of ${runner.total} miles.`);
  }
}
