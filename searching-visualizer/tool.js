const algorithmSelect = document.getElementById('algorithmSelect');
const targetInput = document.getElementById('targetValue');
const arraySizeInput = document.getElementById('arraySize');
const minInput = document.getElementById('minValue');
const maxInput = document.getElementById('maxValue');
const customArrayInput = document.getElementById('customArray');
const arrayBars = document.getElementById('arrayBars');
const feedback = document.getElementById('arrayFeedback');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stepButton = document.getElementById('stepButton');

const algorithmInfo = {
  linear: {
    name: 'Linear Search',
    description: 'Check each value from left to right until the target is found or every array element has been checked. The array can be in any order; duplicates are handled by returning the first match.',
    best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)',
    code: `int linearSearch(const vector<int>& a, int target) {
    for (int i = 0; i < (int)a.size(); ++i) {
        if (a[i] == target) return i;
    }
    return -1;
}`
  },
  binary: {
    name: 'Binary Search',
    description: 'Compare the target with the middle value, then keep only the half that can still contain it. This visualizer sorts an unsorted array before searching and makes the sorted order visible.',
    best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)',
    code: `int binarySearch(const vector<int>& a, int target) {
    int low = 0, high = (int)a.size() - 1;
    while (low <= high) {
        int middle = low + (high - low) / 2;
        if (a[middle] == target) return middle;
        if (a[middle] < target) low = middle + 1;
        else high = middle - 1;
    }
    return -1;
}`
  }
};

let values = [];
let frames = [];
let frameIndex = 0;
let playing = false;
let playbackTimer = null;
let clockTimer = null;
let startedAt = 0;
let elapsedBeforePlay = 0;

function setFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', isError);
}

function showAlgorithmInfo() {
  const info = algorithmInfo[algorithmSelect.value];
  document.getElementById('algorithmTitle').textContent = info.name;
  document.getElementById('algorithmDescription').textContent = info.description;
  document.getElementById('complexityGrid').innerHTML = [
    ['Best time', info.best], ['Average time', info.average], ['Worst time', info.worst], ['Auxiliary space', info.space]
  ].map(([label, value]) => `<div class="complexity-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
  document.getElementById('cppCode').textContent = info.code;
}

function renderBars(frame = null) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || 1;
  const eliminated = new Set(frame?.eliminated || []);
  const current = frame?.current;
  const range = frame?.range;
  const found = frame?.found ?? -1;
  arrayBars.innerHTML = values.map((value, index) => {
    const height = 18 + ((value - minimum) / spread) * 62;
    const classes = ['array-bar'];
    if (eliminated.has(index)) classes.push('is-eliminated');
    else if (range && index >= range[0] && index <= range[1]) classes.push('is-range');
    if (index === current) classes.push('is-comparing');
    if (index === found) classes.push('is-found');
    return `<div class="bar-column" role="listitem" aria-label="Index ${index}, value ${value}${index === found ? ', found' : ''}"><span class="bar-value">${value}</span><div class="array-bar ${classes.slice(1).join(' ')}" style="height:${height}%"></div><span class="bar-index">${index}</span></div>`;
  }).join('');
  const sorted = values.every((value, index) => index === 0 || values[index - 1] <= value);
  document.getElementById('arraySummary').textContent = `${values.length} ${values.length === 1 ? 'value' : 'values'} · ${sorted ? 'ascending order' : 'original order'}`;
}

function setControlState() {
  const isComplete = frames.length > 0 && frameIndex >= frames.length;
  algorithmSelect.disabled = playing;
  targetInput.disabled = playing;
  arraySizeInput.disabled = playing;
  minInput.disabled = playing;
  maxInput.disabled = playing;
  customArrayInput.disabled = playing;
  document.getElementById('generateArray').disabled = playing;
  document.querySelector('#customArrayForm button').disabled = playing;
  playButton.disabled = playing || isComplete;
  pauseButton.disabled = !playing;
  stepButton.disabled = playing || isComplete;
}

function updateElapsed() {
  const elapsed = elapsedBeforePlay + (playing ? performance.now() - startedAt : 0);
  document.getElementById('elapsedTime').textContent = `${(elapsed / 1000).toFixed(2)} s`;
}

function updateFrame(frame) {
  renderBars(frame);
  document.getElementById('comparisonCount').textContent = String(frame.comparisons);
  document.getElementById('currentIndex').textContent = frame.current === null ? '—' : String(frame.current);
  document.getElementById('searchRange').textContent = frame.range ? `${frame.range[0]}–${frame.range[1]}` : '—';
  document.getElementById('runStatus').textContent = frame.status;
  const result = document.getElementById('searchResult');
  result.textContent = frame.done ? `${frame.message} Comparisons: ${frame.comparisons}.` : frame.message;
  result.classList.toggle('is-found', frame.found >= 0);
  result.classList.toggle('is-missing', frame.done && frame.found < 0);
  result.classList.remove('is-error');
  updateElapsed();
}

function createFrames() {
  if (frames.length) return true;
  const target = Number(targetInput.value);
  if (!targetInput.value.trim() || !Number.isSafeInteger(target)) {
    setFeedback('Enter a safe integer target value before searching.', true);
    document.getElementById('searchResult').textContent = 'A valid target value is required.';
    return false;
  }
  try {
    frames = algorithmSelect.value === 'linear'
      ? window.SearchAlgorithms.createLinearSteps(values, target)
      : window.SearchAlgorithms.createBinarySteps(values, target);
    return true;
  } catch (error) {
    setFeedback(error.message, true);
    return false;
  }
}

function stepOnce() {
  if (!createFrames() || frameIndex >= frames.length) return;
  const frame = frames[frameIndex];
  frameIndex += 1;
  updateFrame(frame);
  setFeedback(frame.action === 'compare' ? `Compared target with index ${frame.current}.` : frame.message);
  setControlState();
}

function playbackDelay() {
  return Math.round(850 - (Number(speedControl.value) - 1) * 7.2);
}

function playNext() {
  if (!playing) return;
  if (frameIndex >= frames.length) {
    pausePlayback(true);
    setControlState();
    return;
  }
  stepOnce();
  if (!playing) return;
  if (frameIndex >= frames.length) {
    pausePlayback(true);
    setControlState();
    return;
  }
  playbackTimer = setTimeout(playNext, playbackDelay());
}

function play() {
  if (playing || (frames.length && frameIndex >= frames.length) || !createFrames()) return;
  playing = true;
  startedAt = performance.now();
  clockTimer = setInterval(updateElapsed, 80);
  setControlState();
  playNext();
}

function pausePlayback() {
  if (playbackTimer) clearTimeout(playbackTimer);
  if (clockTimer) clearInterval(clockTimer);
  playbackTimer = null;
  clockTimer = null;
  if (playing) elapsedBeforePlay += performance.now() - startedAt;
  playing = false;
  updateElapsed();
  if (frames.length && frameIndex < frames.length) document.getElementById('runStatus').textContent = 'Paused';
  setControlState();
}

function resetRun(message = 'Ready to search.') {
  pausePlayback();
  frames = [];
  frameIndex = 0;
  elapsedBeforePlay = 0;
  renderBars();
  document.getElementById('comparisonCount').textContent = '0';
  document.getElementById('elapsedTime').textContent = '0.00 s';
  document.getElementById('currentIndex').textContent = '—';
  document.getElementById('searchRange').textContent = '—';
  document.getElementById('runStatus').textContent = 'Ready';
  const result = document.getElementById('searchResult');
  result.textContent = message;
  result.className = 'search-result';
  setFeedback(message);
  setControlState();
}

function sortForBinarySearch() {
  if (algorithmSelect.value !== 'binary') return false;
  const sorted = [...values].sort((left, right) => left - right);
  const changed = sorted.some((value, index) => value !== values[index]);
  if (changed) {
    values = sorted;
    customArrayInput.value = values.join(', ');
    resetRun('Binary Search needs sorted data. The array was sorted in ascending order.');
  }
  return changed;
}

function installArray(array, message) {
  values = [...array];
  customArrayInput.value = values.join(', ');
  const sorted = sortForBinarySearch();
  if (!sorted) resetRun(message);
  else setFeedback(`${message} Binary Search uses the visible ascending array.`);
}

function generateRandomArray() {
  const size = Number(arraySizeInput.value);
  const minimum = Number(minInput.value);
  const maximum = Number(maxInput.value);
  if (!Number.isInteger(size) || size < 1 || size > 32) return setFeedback('Array size must be an integer from 1 to 32.', true);
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum || maximum - minimum > 1000000) return setFeedback('Choose safe integer limits with Min no greater than Max and a range under 1,000,001.', true);
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum);
  installArray(array, 'Generated a new random array.');
}

document.getElementById('generateArray').addEventListener('click', generateRandomArray);
document.getElementById('customArrayForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const tokens = customArrayInput.value.trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length || tokens.length > 32 || tokens.some((token) => !/^[+-]?\d+$/.test(token))) return setFeedback('Enter 1 to 32 comma or space separated integers.', true);
  const array = tokens.map(Number);
  if (array.some((value) => !Number.isSafeInteger(value))) return setFeedback('Every array value must be a safe integer.', true);
  arraySizeInput.value = String(array.length);
  installArray(array, `Loaded ${array.length} custom ${array.length === 1 ? 'value' : 'values'}.`);
});

algorithmSelect.addEventListener('change', () => {
  const sorted = sortForBinarySearch();
  if (!sorted) resetRun();
  showAlgorithmInfo();
});
targetInput.addEventListener('input', () => resetRun('Target updated. Ready to search.'));
playButton.addEventListener('click', play);
pauseButton.addEventListener('click', pausePlayback);
stepButton.addEventListener('click', stepOnce);
document.getElementById('resetButton').addEventListener('click', () => resetRun());
speedControl.addEventListener('input', () => { speedValue.value = `${speedControl.value}%`; });

showAlgorithmInfo();
generateRandomArray();
