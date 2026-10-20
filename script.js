const display = document.getElementById('display');
const expressionLine = document.getElementById('expression');
const angleModeButton = document.getElementById('angleMode');

let expression = '';
let answer = 0;
let angleMode = 'DEG';

function updateDisplay() {
  expressionLine.textContent = expression || 'Ready to calculate';
  display.textContent = expression ? expression.replaceAll('*', '×').replaceAll('/', '÷').replaceAll('sqrt(', '√(').replaceAll('π', 'π') : '0';
}

function append(value) {
  if (display.textContent === 'Error' || expression === 'Error') expression = '';
  if (value === 'Ans') value = String(answer);
  expression += value;
  updateDisplay();
}

function clearAll() {
  expression = '';
  expressionLine.textContent = 'Ready to calculate';
  display.textContent = '0';
}

function deleteLast() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Invalid factorial');
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function calculate() {
  if (!expression.trim()) return;
  try {
    let exp = expression
      .replaceAll('π', 'PI')
      .replace(/\bAns\b/g, `(${answer})`)
      .replace(/\be\b/g, 'E_CONST')
      .replace(/\bsqrt\(/g, 'Math.sqrt(')
      .replace(/\bsin\(/g, 'SIN(')
      .replace(/\bcos\(/g, 'COS(')
      .replace(/\btan\(/g, 'TAN(')
      .replace(/\blog\(/g, 'Math.log10(')
      .replace(/\bln\(/g, 'Math.log(')
      .replace(/\babs\(/g, 'Math.abs(')
      .replace(/\bPI\b/g, 'Math.PI')
      .replace(/\bE_CONST\b/g, 'Math.E')
      .replace(/\^/g, '**');

    exp = exp.replace(/SIN\(([^()]*)\)/g, (_, x) => `Math.sin(${angleMode === 'DEG' ? `((${x})*Math.PI/180)` : `(${x})`})`);
    exp = exp.replace(/COS\(([^()]*)\)/g, (_, x) => `Math.cos(${angleMode === 'DEG' ? `((${x})*Math.PI/180)` : `(${x})`})`);
    exp = exp.replace(/TAN\(([^()]*)\)/g, (_, x) => `Math.tan(${angleMode === 'DEG' ? `((${x})*Math.PI/180)` : `(${x})`})`);

    // Convert postfix factorials, including simple numeric or parenthesized values.
    exp = exp.replace(/(\d+(?:\.\d+)?|Math\.PI|Math\.E|\([^()]*\))!/g, 'factorial($1)');
    if (!/^[0-9+\-*/().,\sA-Za-z_!%]*$/.test(exp)) throw new Error('Invalid input');
    if (!/^(?=.*[0-9A-Za-z(])/.test(exp)) throw new Error('Empty');
    const result = Function('factorial', `"use strict"; return (${exp});`)(factorial);
    if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Math error');
    answer = result;
    expressionLine.textContent = expression + ' =';
    display.textContent = Number(result.toPrecision(12)).toString();
    expression = String(Number(result.toPrecision(12)));
  } catch (error) {
    display.textContent = 'Error';
    expressionLine.textContent = 'Check your expression';
    expression = '';
  }
}

document.querySelectorAll('.key').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    const value = button.dataset.value;
    if (action === 'clear') clearAll();
    else if (action === 'delete') deleteLast();
    else if (action === 'equals') calculate();
    else if (action === 'sign') {
      if (expression) expression = expression.startsWith('-') ? expression.slice(1) : '-' + expression;
      updateDisplay();
    } else if (value) append(value);
  });
});

angleModeButton.addEventListener('click', () => {
  angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
  angleModeButton.textContent = angleMode;
});

document.addEventListener('keydown', (event) => {
  if (/^[0-9.+\-*/()%^]$/.test(event.key)) append(event.key);
  else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
  else if (event.key === 'Backspace') deleteLast();
  else if (event.key === 'Escape') clearAll();
});

updateDisplay();
