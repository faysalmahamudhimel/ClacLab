const units = {
  length: { meter: ['Meters', 1], kilometer: ['Kilometers', 1000], centimeter: ['Centimeters', .01], millimeter: ['Millimeters', .001], mile: ['Miles', 1609.344], yard: ['Yards', .9144], foot: ['Feet', .3048], inch: ['Inches', .0254] },
  weight: { kilogram: ['Kilograms', 1], gram: ['Grams', .001], milligram: ['Milligrams', .000001], pound: ['Pounds', .45359237], ounce: ['Ounces', .028349523125] },
  temperature: { celsius: ['Celsius'], fahrenheit: ['Fahrenheit'], kelvin: ['Kelvin'] }
};
const form = document.getElementById('converterForm');
const type = document.getElementById('unitType');
const from = document.getElementById('fromUnit');
const to = document.getElementById('toUnit');
const result = document.getElementById('result');
const clearResult = () => { result.innerHTML = '<span class="result-label">RESULT</span>'; };
document.querySelector('.result-clear').addEventListener('click', clearResult);

function populateUnits() {
  const options = Object.entries(units[type.value]).map(([key, value]) => `<option value="${key}">${value[0]}</option>`).join('');
  from.innerHTML = options;
  to.innerHTML = options;
  if (from.options.length > 1) to.selectedIndex = 1;
  clearResult();
}
function toCelsius(value, unit) { return unit === 'fahrenheit' ? (value - 32) * 5 / 9 : unit === 'kelvin' ? value - 273.15 : value; }
function fromCelsius(value, unit) { return unit === 'fahrenheit' ? value * 9 / 5 + 32 : unit === 'kelvin' ? value + 273.15 : value; }
type.addEventListener('change', () => { populateUnits(); form.requestSubmit(); });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('amount').value);
  let converted;
  if (type.value === 'temperature') converted = fromCelsius(toCelsius(amount, from.value), to.value);
  else converted = amount * units[type.value][from.value][1] / units[type.value][to.value][1];
  // Keep the full integer portion: toPrecision(10) rounded large conversions
  // (for example, kilograms to grams) and changed the displayed result.
  const formatted = converted.toLocaleString(undefined, { maximumFractionDigits: 8 });
  result.innerHTML = `<span class="result-label">RESULT</span><span class="result-value">${formatted} ${units[type.value][to.value][0]}</span>`;
});
populateUnits();
form.requestSubmit();
