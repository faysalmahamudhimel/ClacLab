(function () {
  function createLinearSteps(input, target) {
    const frames = [];
    let comparisons = 0;
    const eliminated = [];
    for (let index = 0; index < input.length; index += 1) {
      comparisons += 1;
      const found = input[index] === target ? index : -1;
      frames.push({
        action: 'compare', current: index, range: [index, input.length - 1],
        eliminated: [...eliminated], found, comparisons,
        status: found >= 0 ? 'Found' : 'Searching', done: found >= 0,
        message: found >= 0 ? `Found ${target} at index ${found} (position ${found + 1}).` : `Checking index ${index}.`
      });
      if (found >= 0) return frames;
      eliminated.push(index);
    }
    frames.push({ action: 'complete', current: null, range: null, eliminated: [...eliminated], found: -1, comparisons, status: 'Not found', done: true, message: `${target} was not found in the array.` });
    return frames;
  }

  function createBinarySteps(input, target) {
    for (let index = 1; index < input.length; index += 1) {
      if (input[index - 1] > input[index]) throw new Error('Binary Search requires a sorted array.');
    }

    const frames = [];
    let low = 0;
    let high = input.length - 1;
    let comparisons = 0;
    const eliminatedSet = new Set();
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      comparisons += 1;
      const found = input[middle] === target ? middle : -1;
      frames.push({
        action: 'compare', current: middle, middle, range: [low, high], eliminated: [...eliminatedSet], found, comparisons,
        status: found >= 0 ? 'Found' : 'Searching', done: found >= 0,
        message: found >= 0 ? `Found ${target} at index ${found} (position ${found + 1}).` : `Checking middle index ${middle}.`
      });
      if (found >= 0) return frames;

      const previousRange = [low, high];
      if (input[middle] < target) low = middle + 1;
      else high = middle - 1;
      const discarded = Array.from({ length: input.length }, (_, index) => index)
        .filter((index) => index < low || index > high);
      discarded.forEach((index) => eliminatedSet.add(index));
      frames.push({
        action: 'narrow', current: null, middle: null, range: low <= high ? [low, high] : null,
        eliminated: [...eliminatedSet], found: -1, comparisons, status: low <= high ? 'Searching' : 'Not found', done: low > high,
        message: low <= high ? `Discarded part of the previous range (${previousRange[0]}–${previousRange[1]}).` : `${target} was not found in the array.`
      });
    }
    return frames;
  }

  window.SearchAlgorithms = { createLinearSteps, createBinarySteps };
})();
