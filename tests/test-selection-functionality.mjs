// Test script for selection functionality in the calculator service
import calculatorService from '../src/services/calculatorService.js';

const seedLines = [
  "arresters(4*120) +",
  "tape (140*25) +",
  "connector (4*10) +",
  "wallplug (1*10) + wallNails (40*3) +",
  "earthRod 80 + matt140 + 50",
  "",
  "// should equal 4420"
];

console.log("=".repeat(80));
console.log("TESTING SELECTION FUNCTIONALITY");
console.log("=".repeat(80));

// Function to test selection functionality
const testSelection = (startLine, endLine, expectedTotal) => {
  // Get the selected lines
  const selectedLines = seedLines.slice(startLine, endLine + 1);
  const selectedText = selectedLines.join('\n');
  
  console.log(`\n${"-".repeat(40)}`);
  console.log(`TESTING SELECTION (Lines ${startLine + 1}-${endLine + 1})`);
  console.log(`${"-".repeat(40)}`);
  console.log("Selected lines:");
  selectedLines.forEach(line => console.log(`  ${line}`));
  
  // Process the selection using the calculator service
  const processedLines = calculatorService.processInput(selectedText);
  
  // Calculate the total
  const selectionTotal = processedLines.reduce((sum, line) => sum + (line.value || 0), 0);
  
  console.log(`\nSelection total: ${selectionTotal}`);
  console.log(`Expected total: ${expectedTotal}`);
  console.log(`Result: ${Math.abs(selectionTotal - expectedTotal) < 0.1 ? "✅ PASSED" : "❌ FAILED"}`);
  
  return selectionTotal;
};

// Test various selection scenarios
console.log("\n=== Testing partial selections ===");

// Test selection of first 3 lines (lines 1-3)
testSelection(0, 2, 4020); // 480 + 3500 + 40 = 4020

// Test selection of middle 3 lines (lines 2-4)
testSelection(1, 3, 3670); // 3500 + 40 + 130 = 3670

// Test selection of last 3 lines (lines 3-5)
testSelection(2, 4, 440); // 40 + 130 + 270 = 440

console.log("\n=== Testing full selection ===");

// Test selection of all lines (lines 1-5)
const fullSelectionTotal = testSelection(0, 4, 4420); // 480 + 3500 + 40 + 130 + 270 = 4420

console.log("\n=".repeat(40));
console.log(`FULL SELECTION TOTAL: ${fullSelectionTotal}`);
console.log(`EXPECTED TOTAL: 4420`);
console.log(`OVERALL RESULT: ${Math.abs(fullSelectionTotal - 4420) < 0.1 ? "✅ PASSED" : "❌ FAILED"}`);
console.log("=".repeat(40));

console.log("\n=".repeat(40));
console.log("TESTING COMPLETE");
console.log("=".repeat(40));
