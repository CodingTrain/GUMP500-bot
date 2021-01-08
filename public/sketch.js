function setup() {
  noCanvas();
  visualize();
}

async function visualize() {
  const response = await fetch("/api");
  const { people } = await response.json();
  console.log(people);
  const names = Object.keys(people);
  names.sort((a, b) => people[b] - people[a]);
  for (let name of names) {
    createDiv(`${name} ran ${people[name]} miles.`);
  }
}
