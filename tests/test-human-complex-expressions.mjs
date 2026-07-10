import calculatorService from '../src/services/calculatorService.js';

const cases = [
  ['(3 bottles × 3K) + 10K + (2 cakes × 20K)', 59000],
  ['((6 boxes × 12K) + 18K delivery) - 10% discount', 81000],
  ['250K - 20%', 200000],
  ['(180K + 40K delivery) - 10%', 198000],
  ['(120K × 4) + 18% VAT', 566400],
  ['((2 pizzas × 32K) + (3 juices × 8K)) ÷ 5 people', 17600],
  ['(450 km ÷ 15 km/litre) × 6K per litre', 180000],
  ['2.5M - 450K rent - 300K food - 150K transport', 1600000],
  ['(180K food + 40K drinks + 20K transport) ÷ 4 people', 60000],
  ['3 bottles at 3K each + 10K delivery + 2 cakes at 20K each', 59000],
  ['250K with a 20% discount, plus 15K delivery', 215000],
  ['Split 300K food, 50K drinks, and 20K transport between 5 people', 74000],
  ['450 km at 15 km per litre, with fuel costing 6K per litre', 180000],
  ['((5M revenue - 2M expenses) × 30%) + 200K bonus', 1100000],
  ['250K - (20% × 250K)', 200000],
  ['(8 hours × 5 days) - (45 minutes break × 5 days)', 36.25],
  ['((3 hours × 4 projects) + 5 hours meetings) ÷ 5 days', 3.4]
];

let failures = 0;

for (const [input, expected] of cases) {
  const result = calculatorService.evaluateExpression(input);
  const passed = Math.abs(result - expected) < 1e-9;

  if (!passed) {
    failures += 1;
  }

  console.log(`${passed ? 'PASS' : 'FAIL'} ${input} => ${result} expected ${expected}`);
}

if (failures > 0) {
  process.exitCode = 1;
}
