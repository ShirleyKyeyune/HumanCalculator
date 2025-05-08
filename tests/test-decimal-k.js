// Test pattern for "drink soda 1.2k x 300 people"
const testString = "drink soda 1.2k x 300 people";

// Pattern to match and extract values with decimal numbers
const pattern = /([a-zA-Z]+\s+)+?(\d+\.\d+)\s*k\s+([x*])\s*(\d+)([a-zA-Z\s]+)?/i;
const match = testString.match(pattern);

if (match) {
  const [fullMatch, prefix, num1, operator, num2, suffix] = match;
  console.log(`Match found: ${fullMatch}`);
  console.log(`Prefix: ${prefix}, Num1: ${num1}, Operator: ${operator}, Num2: ${num2}, Suffix: ${suffix}`);
  console.log(`Result: ${num1 * 1000} * ${num2} = ${num1 * 1000 * num2}`);
} else {
  console.log("No match found");
}
