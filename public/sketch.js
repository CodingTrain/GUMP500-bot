function setup() {
  noCanvas();
  visualize();
}

async function visualize() {
  const response = await fetch("/api");
  const runners = await response.json();
  console.log(runners);
  runners.sort((a, b) => b.total - a.total);
  for (let runner of runners) {
    createDiv(`${runner.name} ran a total of ${runner.total} miles.`);
  }
}
