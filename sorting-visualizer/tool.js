const algorithmSelect = document.getElementById('algorithmSelect');
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
const resetButton = document.getElementById('resetButton');

const algorithmInfo = {
  bubble: {
    name: 'Bubble Sort',
    description: 'Repeatedly compare neighboring values and swap them when they are out of order. Each pass moves the largest remaining value to the end.',
    best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: `void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; ++i) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; ++j) {
            if (a[j] > a[j + 1]) {
                swap(a[j], a[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`
  },
  selection: {
    name: 'Selection Sort',
    description: 'Find the smallest value in the unsorted suffix and move it to the next position in the sorted prefix.',
    best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: `void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; ++i) {
        int minimum = i;
        for (int j = i + 1; j < n; ++j)
            if (a[j] < a[minimum]) minimum = j;
        if (minimum != i) swap(a[i], a[minimum]);
    }
}`
  },
  insertion: {
    name: 'Insertion Sort',
    description: 'Take each next value as a key, shift larger values to the right, and insert the key into its correct position.',
    best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: `void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); ++i) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            --j;
        }
        a[j + 1] = key;
    }
}`
  },
  merge: {
    name: 'Merge Sort',
    description: 'Split the array into smaller halves, sort each half recursively, then merge the sorted halves back into the array.',
    best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    code: `void mergeSort(vector<int>& a, int left, int right) {
    if (left >= right) return;
    int middle = left + (right - left) / 2;
    mergeSort(a, left, middle);
    mergeSort(a, middle + 1, right);
    vector<int> merged;
    int i = left, j = middle + 1;
    while (i <= middle && j <= right)
        merged.push_back(a[i] <= a[j] ? a[i++] : a[j++]);
    while (i <= middle) merged.push_back(a[i++]);
    while (j <= right) merged.push_back(a[j++]);
    copy(merged.begin(), merged.end(), a.begin() + left);
}`
  },
  quick: {
    name: 'Quick Sort',
    description: 'Choose the last value as a pivot, partition smaller values before it, then recursively sort both partitions.',
    best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n) average, O(n) worst',
    code: `int partition(vector<int>& a, int low, int high) {
    int pivot = a[high];
    int boundary = low;
    for (int i = low; i < high; ++i) {
        if (a[i] <= pivot) swap(a[boundary++], a[i]);
    }
    swap(a[boundary], a[high]);
    return boundary;
}
void quickSort(vector<int>& a, int low, int high) {
    if (low >= high) return;
    int pivot = partition(a, low, high);
    quickSort(a, low, pivot - 1);
    quickSort(a, pivot + 1, high);
}`
  }
};

let originalArray = [];
let frames = [];
let frameIndex = 0;
let playing = false;
let playbackTimer = null;
let clockTimer = null;
let startedAt = 0;
let elapsedBeforePlay = 0;
let currentFrame = null;

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

function renderBars(values = originalArray, frame = null) {
  const low = Math.min(...originalArray);
  const high = Math.max(...originalArray);
  const spread = high - low || 1;
  const active = new Set(frame?.active || []);
  const moved = new Set(frame?.moved || []);
  const pivots = new Set(frame?.pivot || []);
  const sorted = new Set(frame?.sorted || []);

  arrayBars.innerHTML = values.map((value, index) => {
    const height = 18 + ((value - low) / spread) * 62;
    const classes = ['array-bar'];
    if (sorted.has(index)) classes.push('is-sorted');
    if (active.has(index)) classes.push('is-comparing');
    if (moved.has(index)) classes.push('is-moving');
    if (pivots.has(index)) classes.push('is-pivot');
    return `<div class="bar-column" role="listitem" aria-label="Index ${index}, value ${value}${sorted.has(index) ? ', sorted' : ''}"><span class="bar-value">${value}</span><div class="array-bar ${classes.slice(1).join(' ')}" style="height:${height}%"></div><span class="bar-index">${index}</span></div>`;
  }).join('');
  document.getElementById('arraySummary').textContent = `${values.length} ${values.length === 1 ? 'value' : 'values'} · ${frame?.status === 'Complete' ? 'sorted' : frame ? 'sorting in progress' : 'ready to sort'}`;
}

function setControlState() {
  const isComplete = frames.length > 0 && frameIndex >= frames.length;
  algorithmSelect.disabled = playing;
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

function formatElapsed(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function updateElapsed() {
  const elapsed = elapsedBeforePlay + (playing ? performance.now() - startedAt : 0);
  document.getElementById('elapsedTime').textContent = formatElapsed(elapsed);
}

function applyFrame(frame) {
  currentFrame = frame;
  renderBars(frame.array, frame);
  document.getElementById('comparisonCount').textContent = String(frame.comparisons);
  document.getElementById('moveCount').textContent = String(frame.moves);
  document.getElementById('runStatus').textContent = frame.status;
  const heldKey = document.getElementById('heldKey');
  heldKey.hidden = frame.heldValue === undefined;
  heldKey.textContent = frame.heldValue === undefined ? '' : `KEY ${frame.heldValue}`;
  document.getElementById('progressCount').textContent = `${frameIndex} / ${frames.length}`;
  if (frame.heldValue !== undefined) setFeedback(`Insertion Sort is holding key ${frame.heldValue} while shifting larger values.`);
  else if (frame.pivot?.length) setFeedback(`Pivot at index ${frame.pivot.join(', ')}.`);
  else if (frame.action === 'compare') setFeedback(`Comparing array positions ${frame.active.map((index) => index + 1).join(' and ')}.`);
  else if (frame.action === 'swap') setFeedback('Swapped two values.');
  else if (frame.action === 'move') setFeedback('Moved a value to its algorithm-determined position.');
  if (frame.status === 'Complete') setFeedback(`Sorted ${frame.array.length} values using ${algorithmInfo[algorithmSelect.value].name}.`);
  updateElapsed();
}

function createFrames() {
  if (!frames.length) frames = window.SortingAlgorithms.createSortingSteps(originalArray, algorithmSelect.value);
}

function stepOnce() {
  createFrames();
  if (frameIndex >= frames.length) return;
  const frame = frames[frameIndex];
  frameIndex += 1;
  applyFrame(frame);
  setControlState();
}

function playbackDelay() {
  return Math.round(850 - (Number(speedControl.value) - 1) * 7.2);
}

function playNext() {
  if (!playing) return;
  if (frameIndex >= frames.length) {
    pausePlayback(true);
    document.getElementById('runStatus').textContent = 'Complete';
    setControlState();
    return;
  }
  stepOnce();
  if (frameIndex >= frames.length) {
    pausePlayback(true);
    setControlState();
    return;
  }
  playbackTimer = setTimeout(playNext, playbackDelay());
}

function play() {
  if (playing || (frames.length && frameIndex >= frames.length)) return;
  createFrames();
  playing = true;
  startedAt = performance.now();
  clockTimer = setInterval(updateElapsed, 80);
  setControlState();
  playNext();
}

function pausePlayback(complete = false) {
  if (playbackTimer) clearTimeout(playbackTimer);
  if (clockTimer) clearInterval(clockTimer);
  playbackTimer = null;
  clockTimer = null;
  if (playing) elapsedBeforePlay += performance.now() - startedAt;
  playing = false;
  updateElapsed();
  if (!complete && frames.length && frameIndex < frames.length) document.getElementById('runStatus').textContent = 'Paused';
  setControlState();
}

function resetRun() {
  pausePlayback();
  frames = [];
  frameIndex = 0;
  elapsedBeforePlay = 0;
  currentFrame = null;
  renderBars(originalArray);
  document.getElementById('comparisonCount').textContent = '0';
  document.getElementById('moveCount').textContent = '0';
  document.getElementById('elapsedTime').textContent = '0.00 s';
  document.getElementById('progressCount').textContent = '0 / 0';
  document.getElementById('runStatus').textContent = 'Ready';
  document.getElementById('heldKey').hidden = true;
  setFeedback('Ready to sort. Play or step through the algorithm.');
  setControlState();
}

function installArray(values, message) {
  originalArray = [...values];
  customArrayInput.value = originalArray.join(', ');
  resetRun();
  setFeedback(message);
}

function generateRandomArray() {
  const size = Number(arraySizeInput.value);
  const minimum = Number(minInput.value);
  const maximum = Number(maxInput.value);
  if (!Number.isInteger(size) || size < 1 || size > 32) return setFeedback('Array size must be an integer from 1 to 32.', true);
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum || maximum - minimum > 1000000) return setFeedback('Choose safe integer limits with Min no greater than Max and a range under 1,000,001.', true);
  const values = Array.from({ length: size }, () => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum);
  installArray(values, 'Generated a new random array.');
}

document.getElementById('generateArray').addEventListener('click', generateRandomArray);
document.getElementById('customArrayForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const tokens = customArrayInput.value.trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length || tokens.length > 32 || tokens.some((token) => !/^[+-]?\d+$/.test(token))) return setFeedback('Enter 1 to 32 comma or space separated integers.', true);
  const values = tokens.map(Number);
  if (values.some((value) => !Number.isSafeInteger(value))) return setFeedback('Every array value must be a safe integer.', true);
  arraySizeInput.value = String(values.length);
  installArray(values, `Loaded ${values.length} custom ${values.length === 1 ? 'value' : 'values'}.`);
});

algorithmSelect.addEventListener('change', () => { resetRun(); showAlgorithmInfo(); });
playButton.addEventListener('click', play);
pauseButton.addEventListener('click', () => pausePlayback());
stepButton.addEventListener('click', stepOnce);
resetButton.addEventListener('click', resetRun);
speedControl.addEventListener('input', () => { speedValue.value = `${speedControl.value}%`; });

showAlgorithmInfo();
generateRandomArray();
