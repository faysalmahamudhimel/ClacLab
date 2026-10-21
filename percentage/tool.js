const form = document.getElementById('percentageForm');
const operation = document.getElementById('operation');
const firstLabel = document.getElementById('firstLabel');
const secondLabel = document.getElementById('secondLabel');
const result = document.getElementById('result');
const clearResult = () => { result.innerHTML = '<span class="result-label">RESULT</span>'; };
const showResult = (value) => {
  result.innerHTML = `<span class="result-label">RESULT</span><span class="result-value">${value}</span>`;
};
document.querySelector('.result-clear').addEventListener('click', clearResult);

operation.addEventListener('change', () => {
  const mode = operation.value;
  firstLabel.textContent = mode === 'of' ? 'Percentage (X)' : mode === 'change' ? 'Starting value (X)' : 'Number (X)';
  secondLabel.textContent = mode === 'of' ? 'Number (Y)' : mode === 'change' ? 'New value (Y)' : 'Percentage (Y)';
  clearResult();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const x = Number(document.getElementById('first').value);
  const y = Number(document.getElementById('second').value);
  let value;
  let message;
  if (operation.value === 'of') { value = x / 100 * y; message = `${x}% of ${y} = ${value}`; }
  else if (operation.value === 'change') {
    if (x === 0) { showResult('Percentage change cannot be calculated from zero.'); return; }
    value = (y - x) / Math.abs(x) * 100; message = `${Number(value.toPrecision(6))}%`;
  } else {
    value = x * (1 + (operation.value === 'increase' ? 1 : -1) * y / 100);
    message = `${x} ${operation.value === 'increase' ? 'increased' : 'decreased'} by ${y}% = ${value}`;
  }
  showResult(message);
});
