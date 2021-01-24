// Helper functions for percentages. 500 is the goal for the year. 
// If totalMiles is over 500 we always return 100
const completedMilesAsPercentage = totalMiles => totalMiles >= 500 ? 100 : (totalMiles / 500) * 100;
const roundToFive = val => Math.round(val / 5) * 5;

// Function takes the runner's total in miles and returns a progress bar rounded to the nearest 5%.
// and percentage of target reached. Makes use of the nifty String.repeat() method
function getStringProgressBar(totalMiles) {
  const perctOfGoalCompleted = completedMilesAsPercentage(totalMiles);
  const perctToNearestFive = roundToFive(perctOfGoalCompleted);
  const half = '◐';
  const whole = '●';
  const empty = '○';
  const numHalves = (perctToNearestFive % 10) / 5;
  const numWholes = (perctToNearestFive - numHalves) / 10;
  const numEmpty = 10 - numWholes + numHalves;
  return `${whole.repeat(numWholes)}${half.repeat(numHalves)}${empty.repeat(numEmpty)} ${perctOfGoalCompleted.toFixed(1)}%`
}

//ideas...
//getResponseFromMiles(), a function which takes the runner's number of miles
//and returns an appropriate text response.

exports.getStringProgressBar = getStringProgressBar;