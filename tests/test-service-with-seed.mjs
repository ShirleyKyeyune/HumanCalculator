// Test script for the calculator service with seed lines
import calculatorService from '../src/services/calculatorService.js';

const seedLines = [
  "arresters(4*120) +",
  "tape (140*25) +",
  "connector (4*10) +",
  "wallplug (1*10) + wallNails (40*3) +",
  "earthRod 80 + matt140 + 50",
  "",
  "// should equal 4280"
];

// Remove empty lines and comments
const validLines = seedLines.filter(line => line.trim() && !line.trim().startsWith('//'));

console.log("=".repeat(80));
console.log("TESTING CALCULATOR SERVICE WITH SEED LINES");
console.log("=".repeat(80));

// Process each line with the calculator service
const processInput = (input) => {
  return calculatorService.processInput(input);
};

// Process all lines at once
const allLines = validLines.join('\n');
console.log(`\nProcessing all lines:\n${allLines}\n`);

const results = processInput(allLines);
console.log("\nResults from calculator service:");
console.log(JSON.stringify(results, null, 2));

// Calculate total
let total = 0;
results.forEach(result => {
  if (result.value !== null && !isNaN(result.value)) {
    total += result.value;
  }
});

console.log(`\nTotal from calculator service: ${total}`);
console.log(`Expected total: 4420`);
console.log(`Result: ${Math.abs(total - 4420) < 0.1 ? "✅ PASSED" : "❌ FAILED"}`);

console.log("\n" + "=".repeat(80));
console.log("TESTING COMPLETE");
console.log("=".repeat(80));
