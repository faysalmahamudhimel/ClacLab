const form = document.getElementById('numberForm');
const numberInput = document.getElementById('numberInput');
const inputBase = document.getElementById('inputBase');
const outputBase = document.getElementById('outputBase');
const result = document.getElementById('result');

function resetResult() {
  result.innerHTML = '<span class="result-label">RESULT</span>';
}

document.querySelector('.result-clear').addEventListener('click', resetResult);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = numberInput.value.trim();
  const base = Number(inputBase.value);
  const digits = '0123456789abcdef';
  const unsigned = raw.replace(/^[+-]/, '').toLowerCase();

  if (!unsigned || [...unsigned].some((digit) => digits.indexOf(digit) < 0 || digits.indexOf(digit) >= base)) {
    result.innerHTML = '<span class="result-label">RESULT</span><span class="result-error">That number contains a digit not valid for the selected base.</span>';
    numberInput.setAttribute('aria-invalid', 'true');
    return;
  }

  numberInput.removeAttribute('aria-invalid');
  let value = 0n;
  for (const digit of unsigned) value = value * BigInt(base) + BigInt(digits.indexOf(digit));
  if (raw.startsWith('-')) value = -value;

  const converted = value.toString(Number(outputBase.value)).toUpperCase();
  result.innerHTML = `<span class="result-label">RESULT</span><span class="result-value">${converted}</span>`;
});
