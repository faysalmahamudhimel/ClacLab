const form = document.getElementById('ageForm');
const birthInput = document.getElementById('birthDate');
const asOfInput = document.getElementById('asOfDate');
const result = document.getElementById('result');
const clearResult = () => { result.innerHTML = '<span class="result-label">RESULT</span>'; };
document.querySelector('.result-clear').addEventListener('click', clearResult);
const today = new Date();
const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
birthInput.max = todayISO;
asOfInput.value = todayISO;
asOfInput.max = todayISO;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const birth = new Date(`${birthInput.value}T00:00:00`);
  const asOf = new Date(`${asOfInput.value}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime()) || birth > asOf) {
    result.innerHTML = '<span class="result-label">RESULT</span><span class="result-value">Choose a valid date of birth before the calculation date.</span>';
    return;
  }
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  result.innerHTML = `<span class="result-label">RESULT</span><span class="result-value">${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}, ${days} ${days === 1 ? 'day' : 'days'}</span>`;
});
