/**
 * Complex Expression Handler
 *
 * Normalizes human-written calculations into a compact math expression and
 * evaluates it with standard operator precedence. Additive percentages use the
 * current subtotal: "250K - 20%" => 250000 - (250000 * 0.2).
 */

const NUMBER_PATTERN = String.raw`\d+(?:\.\d+)?`;
const SUFFIX_PATTERN = String.raw`[km]?`;
const VALUE_PATTERN = String.raw`${NUMBER_PATTERN}\s*${SUFFIX_PATTERN}`;

const toNumber = (value, suffix = '') => {
  const multiplier = suffix.toLowerCase() === 'k'
    ? 1000
    : suffix.toLowerCase() === 'm'
      ? 1000000
      : 1;

  return parseFloat(value) * multiplier;
};

const shouldUseComplexHandler = (expression) => {
  if (!expression) return false;

  const expr = expression.toLowerCase();
  return /[()+\-*/×x÷%]/.test(expr) ||
    /\b(plus|minus|split|between|discount|tax|vat|service charge|delivery|at|each|per|costing|with)\b/.test(expr) ||
    /\d+(?:\.\d+)?\s*[km]\b/i.test(expr);
};

const replaceNaturalFuelExpression = (expr) => {
  const fuelRegex = new RegExp(
    String.raw`(${VALUE_PATTERN})\s*km\s*(?:at|\/|÷)\s*(${VALUE_PATTERN})\s*km\s*(?:per|\/)\s*lit(?:re|er)?s?(?:\s*,?\s*with\s*fuel\s*costing)?\s*(${VALUE_PATTERN})\s*(?:per\s*lit(?:re|er)?|\/\s*lit(?:re|er)?)?`,
    'gi'
  );

  return expr.replace(fuelRegex, (_match, distance, efficiency, price) => {
    return `((${distance})/(${efficiency}))*(${price})`;
  });
};

const replaceAtEachExpressions = (expr) => {
  const atEachRegex = new RegExp(
    String.raw`\b(${VALUE_PATTERN})\s+[a-z][a-z\s/]*?\s+(?:at|@)\s+(${VALUE_PATTERN})(?:\s+(?:each|per\s+[a-z][a-z\s/]*))?`,
    'gi'
  );

  return expr.replace(atEachRegex, '($1*$2)');
};

const replaceSplitExpressions = (expr) => {
  const splitRegex = /\bsplit\s+(.+?)\s+(?:between|among|across|by)\s+(\d+(?:\.\d+)?)\s+(?:people|persons|team members|partners|remaining people|members)?\b/i;
  const splitMatch = expr.match(splitRegex);

  if (!splitMatch) return expr;

  const [, billText, people] = splitMatch;
  const billExpression = billText
    .replace(/\band\b/gi, '+')
    .replace(/,/g, '+')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-');

  return expr.replace(splitRegex, `((${billExpression})/${people})`);
};

const normalizeHumanExpression = (expression) => {
  let expr = expression.replace(/,/g, '').trim();

  expr = replaceNaturalFuelExpression(expr);
  expr = replaceSplitExpressions(expr);
  expr = replaceAtEachExpressions(expr);

  if (/\bhours?\b/i.test(expr)) {
    expr = expr.replace(/\b(\d+(?:\.\d+)?)\s*minutes?\b/gi, '($1/60)');
  }

  expr = expr
    .replace(/\bkm\s*\/\s*lit(?:re|er)s?\b/gi, ' ')
    .replace(/\bgb\s*\/\s*[a-z]+\b/gi, ' ')
    .replace(/\btb\s*\/\s*[a-z]+\b/gi, ' ')
    .replace(/×/g, '*')
    .replace(/(^|[\d)\s])x(?=[\d(\s])/gi, '$1*')
    .replace(/÷/g, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\badd(?:ed)?\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\bless\b/gi, '-')
    .replace(/\bwith\s+(?:a\s+)?(\d+(?:\.\d+)?)%\s+(?:off|discount)\b/gi, '- $1%')
    .replace(/\b(?:off|discount)\b/gi, '')
    .replace(/\b(?:vat|tax|service charge|annual discount|daily buffer|profit|savings|investment)\b/gi, '')
    .replace(/\b(?:delivery|transport|fuel|parking|toll fees|refund|rent|food|bills|expenses|bonus|materials|labou?r|installation|accessories|setup fee|hosting|transaction fees|coupon|paid by [a-z]+|total|stock costs|selling price|cost|revenue|sales|income|break)\b/gi, '')
    .replace(/\b(?:people|persons|partners|team members|members|remaining people|days?|working days?|months?|nights?|hours?|minutes?|projects?|meetings?|tasks?|users?|subscriptions?|products?|items?|units?|boxes?|bags?|bottles?|cakes?|shirts?|trousers?|shoes?|drinks?|pizzas?|meals?|juices?|burgers?|fries?|platters?|sodas?|trips?|taxi rides?|boda rides?|rooms?|bricks?|cement|sheets?|workers?|metres?|meters?|doors?|windows?|chairs?|phones?|litres?|liters?|km|gb|tb)\b/gi, '')
    .replace(/\b(?:of|by|for|from|to|in|on|and|the|a|an|each|per|between|among|across|remaining|daily|monthly|annual|with|costing|price|charge|fees?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Adjacent money/quantity values separated only by spaces are usually list
  // items after label words are stripped, e.g. "180K food 40K drinks".
  expr = expr.replace(
    new RegExp(String.raw`(${VALUE_PATTERN})\s+(?=${VALUE_PATTERN})`, 'gi'),
    '$1 + '
  );

  return expr;
};

const tokenize = (expression) => {
  const tokens = [];
  const expr = expression.replace(/\s+/g, '');
  let index = 0;

  while (index < expr.length) {
    const char = expr[index];

    if ('+-*/()%'.includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }

    const numberMatch = expr.slice(index).match(/^\d+(?:\.\d+)?([km])?/i);
    if (numberMatch) {
      const fullMatch = numberMatch[0];
      const suffix = numberMatch[1] || '';
      const number = fullMatch.replace(/[km]$/i, '');
      tokens.push({ type: 'number', value: toNumber(number, suffix) });
      index += fullMatch.length;
      continue;
    }

    throw new Error(`Unexpected token "${char}" in "${expression}"`);
  }

  return tokens;
};

const createParser = (tokens) => {
  let position = 0;

  const peek = () => tokens[position];
  const consume = (type) => {
    const token = peek();
    if (!token || token.type !== type) {
      throw new Error(`Expected "${type}" but found "${token?.type || 'end'}"`);
    }
    position += 1;
    return token;
  };

  const parseFactor = () => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === '+') {
      consume('+');
      return parseFactor();
    }

    if (token.type === '-') {
      consume('-');
      const factor = parseFactor();
      return { value: -factor.value, isPercent: factor.isPercent };
    }

    if (token.type === '(') {
      consume('(');
      const result = parseExpression();
      consume(')');
      return result;
    }

    if (token.type === 'number') {
      consume('number');
      if (peek()?.type === '%') {
        consume('%');
        return { value: token.value / 100, isPercent: true };
      }
      return { value: token.value, isPercent: false };
    }

    throw new Error(`Unexpected token "${token.type}"`);
  };

  const parseTerm = () => {
    let left = parseFactor();

    while (peek()?.type === '*' || peek()?.type === '/') {
      const operator = consume(peek().type).type;
      const right = parseFactor();

      left = {
        value: operator === '*' ? left.value * right.value : left.value / right.value,
        isPercent: false
      };
    }

    return left;
  };

  function parseExpression() {
    let left = parseTerm();

    while (peek()?.type === '+' || peek()?.type === '-') {
      const operator = consume(peek().type).type;
      const right = parseTerm();
      const rightValue = right.isPercent ? left.value * right.value : right.value;

      left = {
        value: operator === '+' ? left.value + rightValue : left.value - rightValue,
        isPercent: false
      };
    }

    return left;
  }

  return {
    parse: () => {
      const result = parseExpression();
      if (position < tokens.length) {
        throw new Error(`Unexpected token "${tokens[position].type}"`);
      }
      return result.value;
    }
  };
};

export const processComplexExpression = (expression) => {
  const trimmedExpression = expression.trim();

  if (!shouldUseComplexHandler(trimmedExpression)) {
    return expression;
  }

  try {
    const normalizedExpression = normalizeHumanExpression(trimmedExpression);
    const tokens = tokenize(normalizedExpression);
    const result = createParser(tokens).parse();

    if (!Number.isFinite(result)) {
      throw new Error('Expression produced a non-finite result');
    }

    return result.toString();
  } catch (error) {
    console.error(`Error processing complex expression: ${error.message}`);
    return expression;
  }
};

const complexExpressionHandler = {
  processComplexExpression
};

export default complexExpressionHandler;
