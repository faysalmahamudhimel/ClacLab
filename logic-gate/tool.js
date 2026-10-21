const gateSelect = document.getElementById('gateSelect');
const inputAButton = document.getElementById('inputA');
const inputBButton = document.getElementById('inputB');
const inputBRow = document.getElementById('inputBRow');
const stateA = document.getElementById('valueA');
const stateB = document.getElementById('valueB');
const outputValue = document.getElementById('outputValue');
const outputState = document.getElementById('outputState');
const truthRows = document.getElementById('truthRows');
const gateShape = document.getElementById('gateShape');
const wireA = document.getElementById('wireA');
const wireB = document.getElementById('wireB');
const wireOut = document.getElementById('wireOut');
const wireLabelB = document.getElementById('wireLabelB');
const wireLabelA = document.getElementById('wireLabelA');
const nodeA = document.getElementById('nodeA');
const nodeB = document.getElementById('nodeB');
const nodeOut = document.getElementById('nodeOut');
const circuitSvg = document.getElementById('logicCircuit');

const gates = {
  AND: {
    symbol: '∧', expression: 'Y = A ∧ B', description: 'The output is ON only when both inputs are ON.',
    visual: '&amp;', body: '<path class="gate-body" d="M250 42 H315 A70 70 0 0 1 315 182 H250 Z" />'
  },
  OR: {
    symbol: '∨', expression: 'Y = A ∨ B', description: 'The output is ON when at least one input is ON.',
    visual: '≥1', body: '<path class="gate-body" d="M250 42 Q286 112 250 182 Q326 182 390 112 Q326 42 250 42 Z" />'
  },
  NOT: {
    symbol: '¬', expression: 'Y = ¬A', description: 'The output is the opposite of the input.',
    visual: '1', body: '<path class="gate-body" d="M260 43 L385 112 L260 181 Z" /><circle class="gate-bubble" cx="395" cy="112" r="10" />', oneInput: true
  },
  NAND: {
    symbol: '⊼', expression: 'Y = ¬(A ∧ B)', description: 'The output is OFF only when both inputs are ON.',
    visual: '&amp;', body: '<path class="gate-body" d="M250 42 H305 A70 70 0 0 1 305 182 H250 Z" /><circle class="gate-bubble" cx="395" cy="112" r="10" />', inverted: true
  },
  NOR: {
    symbol: '⊽', expression: 'Y = ¬(A ∨ B)', description: 'The output is ON only when both inputs are OFF.',
    visual: '≥1', body: '<path class="gate-body" d="M250 42 Q286 112 250 182 Q316 182 380 112 Q316 42 250 42 Z" /><circle class="gate-bubble" cx="395" cy="112" r="10" />', inverted: true
  },
  XOR: {
    symbol: '⊕', expression: 'Y = A ⊕ B', description: 'The output is ON when the inputs are different.',
    visual: '=1', body: '<path class="gate-extra" d="M235 42 Q271 112 235 182" /><path class="gate-body" d="M250 42 Q286 112 250 182 Q326 182 390 112 Q326 42 250 42 Z" />'
  },
  XNOR: {
    symbol: '⊙', expression: 'Y = ¬(A ⊕ B)', description: 'The output is ON when the inputs are the same.',
    visual: '=1', body: '<path class="gate-extra" d="M235 42 Q271 112 235 182" /><path class="gate-body" d="M250 42 Q286 112 250 182 Q316 182 380 112 Q316 42 250 42 Z" /><circle class="gate-bubble" cx="395" cy="112" r="10" />', inverted: true
  }
};

let a = 0;
let b = 0;

function evaluate(gate, inputA, inputB) {
  switch (gate) {
    case 'AND': return inputA & inputB;
    case 'OR': return inputA | inputB;
    case 'NOT': return inputA ? 0 : 1;
    case 'NAND': return (inputA & inputB) ? 0 : 1;
    case 'NOR': return (inputA | inputB) ? 0 : 1;
    case 'XOR': return inputA ^ inputB;
    case 'XNOR': return inputA === inputB ? 1 : 0;
    default: return 0;
  }
}

function renderTruthTable(gate) {
  const oneInput = gates[gate].oneInput;
  const combinations = oneInput ? [[0, 0], [1, 0]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
  document.getElementById('truthBHeading').hidden = oneInput;
  truthRows.innerHTML = combinations.map(([inputA, inputB]) => {
    const current = inputA === a && (oneInput || inputB === b);
    const output = evaluate(gate, inputA, inputB);
    return `<tr${current ? ' class="is-current" aria-current="true"' : ''}><td>${inputA}</td>${oneInput ? '' : `<td>${inputB}</td>`}<td>${output}</td></tr>`;
  }).join('');
}

function renderCircuit(gate, output) {
  const config = gates[gate];
  const oneInput = config.oneInput;
  gateShape.innerHTML = `${config.body}<text class="gate-symbol" x="320" y="119">${config.visual}</text>`;

  const curvedInput = ['OR', 'NOR', 'XOR', 'XNOR'].includes(gate);
  const inputEnd = gate === 'NOT' ? 260 : curvedInput ? 266 : 250;
  wireA.setAttribute('d', oneInput ? `M42 72 V112 H${inputEnd}` : `M42 72 H${inputEnd}`);
  wireB.setAttribute('d', `M42 152 H${inputEnd}`);
  wireB.hidden = oneInput;
  wireLabelB.hidden = oneInput;
  nodeB.hidden = oneInput;
  wireLabelA.setAttribute('y', oneInput ? '117' : '77');
  nodeA.setAttribute('cy', oneInput ? '112' : '72');
  nodeA.classList.toggle('is-high', Boolean(a));
  nodeB.classList.toggle('is-high', Boolean(b) && !oneInput);
  wireOut.setAttribute('d', config.inverted ? 'M405 112 H574' : 'M390 112 H574');
  nodeOut.setAttribute('cx', '574');
  nodeOut.classList.toggle('is-high', Boolean(output));
  circuitSvg.classList.toggle('one-input', oneInput);
  wireA.classList.toggle('is-high', Boolean(a));
  wireB.classList.toggle('is-high', Boolean(b) && !oneInput);
  wireOut.classList.toggle('is-high', Boolean(output));

  document.getElementById('circuitSvgTitle').textContent = `${gate} gate circuit`;
  document.getElementById('circuitSvgDesc').textContent = oneInput
    ? `Input A, currently ${a}, connects through a NOT gate to output Y, currently ${output}.`
    : `Inputs A and B, currently ${a} and ${b}, connect through a ${gate} gate to output Y, currently ${output}.`;
  document.getElementById('circuitSubtitle').textContent = `${gate} gate · live signal`;
}

function render() {
  const gate = gateSelect.value;
  const config = gates[gate];
  const output = evaluate(gate, a, b);
  const onA = Boolean(a);
  const onB = Boolean(b);
  const onOutput = Boolean(output);

  stateA.textContent = String(a);
  stateB.textContent = String(b);
  inputAButton.setAttribute('aria-pressed', String(onA));
  inputAButton.setAttribute('aria-label', `Input A, ${onA ? 'ON' : 'OFF'}`);
  inputBButton.setAttribute('aria-pressed', String(onB));
  inputBButton.setAttribute('aria-label', `Input B, ${onB ? 'ON' : 'OFF'}`);
  inputBRow.hidden = config.oneInput;

  outputValue.textContent = String(output);
  outputState.classList.toggle('is-on', onOutput);
  outputState.innerHTML = `<span class="output-state-dot"></span> ${onOutput ? 'ON' : 'OFF'}`;
  document.getElementById('gateSymbol').textContent = config.symbol;
  document.getElementById('booleanExpression').textContent = config.expression;
  document.getElementById('gateDescription').textContent = config.description;

  renderCircuit(gate, output);
  renderTruthTable(gate);
}

inputAButton.addEventListener('click', () => { a = a ? 0 : 1; render(); });
inputBButton.addEventListener('click', () => { b = b ? 0 : 1; render(); });
gateSelect.addEventListener('change', render);
document.getElementById('resetInputs').addEventListener('click', () => { a = 0; b = 0; render(); });

render();
