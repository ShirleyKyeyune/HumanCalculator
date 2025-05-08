// Complex patterns to be added to processSingleLineExpression
// Handle "300 people × 1,200 bottles each" format
processedExpr = processedExpr.replace(/(\d+(?:,\d+)?)\s*(?:people|person)?\s*[×x]\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  const cleanNum2 = num2.replace(/,/g, '');
  return `${cleanNum1} * ${cleanNum2}`;
});

// Handle "1,200 bottles for each of 300 people" format
processedExpr = processedExpr.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?\s*(?:for|per)\s*(?:each|one)?\s*(?:of)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  const cleanNum2 = num2.replace(/,/g, '');
  return `${cleanNum1} * ${cleanNum2}`;
});

// Handle "Total bottles: 1,200 × 300" format
processedExpr = processedExpr.replace(/(?:Total|Quantity)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  const cleanNum2 = num2.replace(/,/g, '');
  return `${cleanNum1} * ${cleanNum2}`;
});

// Handle "Supplying 300 people with 1.2k bottles each" format
processedExpr = processedExpr.replace(/(?:Supplying)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*(?:with)\s*(\d+(?:,\d+)?|\d+\.\d+k)\s*(?:bottles|bottle)/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  let cleanNum2 = num2.replace(/,/g, '');
  if (cleanNum2.toLowerCase().includes('k')) {
    cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
  }
  return `${cleanNum1} * ${cleanNum2}`;
});

// Handle "Bottles for 300 people @ 1,200 each" format
processedExpr = processedExpr.replace(/(?:Bottles|Bottle)\s*for\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+k)/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  let cleanNum2 = num2.replace(/,/g, '');
  if (cleanNum2.toLowerCase().includes('k')) {
    cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
  }
  return `${cleanNum1} * ${cleanNum2}`;
});

// Handle "Total for 300 bottles @ UGX 1,200" format
processedExpr = processedExpr.replace(/(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+(?:,\d+)?|\d+\.\d+k)/gi, (match, num1, num2) => {
  const cleanNum1 = num1.replace(/,/g, '');
  let cleanNum2 = num2.replace(/,/g, '');
  if (cleanNum2.toLowerCase().includes('k')) {
    cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
  }
  return `${cleanNum1} * ${cleanNum2}`;
});
