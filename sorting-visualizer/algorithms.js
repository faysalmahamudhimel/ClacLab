(function () {
  function createSortingSteps(input, algorithm) {
    const values = [...input];
    const frames = [];
    const sorted = new Set();
    let comparisons = 0;
    let moves = 0;
    let status = 'Sorting';

    function record(action, active = [], moved = [], pivot = [], extra = {}) {
      frames.push({
        action,
        array: [...values],
        active: [...active],
        moved: [...moved],
        pivot: [...pivot],
        sorted: [...sorted],
        comparisons,
        moves,
        status,
        ...extra
      });
    }
    function compare(i, j, extra = {}) {
      comparisons += 1;
      record('compare', [i, j], [], extra.pivot || [], extra);
    }
    function swap(i, j, extra = {}) {
      if (i === j) return;
      [values[i], values[j]] = [values[j], values[i]];
      moves += 1;
      record('swap', [i, j], [i, j], extra.pivot || [], extra);
    }
    function write(index, value, active = [], extra = {}) {
      values[index] = value;
      moves += 1;
      record('move', active, [index], extra.pivot || [], extra);
    }
    function markSorted(indices, extra = {}) {
      indices.forEach((index) => sorted.add(index));
      record('sorted', [], [], extra.pivot || [], extra);
    }

    if (algorithm === 'bubble') {
      for (let end = values.length - 1; end > 0; end -= 1) {
        let swapped = false;
        for (let j = 0; j < end; j += 1) {
          compare(j, j + 1);
          if (values[j] > values[j + 1]) {
            swap(j, j + 1);
            swapped = true;
          }
        }
        markSorted([end]);
        if (!swapped) {
          markSorted(Array.from({ length: end }, (_, index) => index));
          break;
        }
      }
    } else if (algorithm === 'selection') {
      for (let i = 0; i < values.length - 1; i += 1) {
        let minimum = i;
        for (let j = i + 1; j < values.length; j += 1) {
          compare(minimum, j, { sorted: [...sorted], selected: i });
          if (values[j] < values[minimum]) minimum = j;
        }
        if (minimum !== i) swap(i, minimum, { sorted: [...sorted], selected: i });
        markSorted([i]);
      }
    } else if (algorithm === 'insertion') {
      for (let i = 1; i < values.length; i += 1) {
        const key = values[i];
        let j = i - 1;
        while (j >= 0) {
          compare(j, j, { heldValue: key });
          if (values[j] <= key) break;
          write(j + 1, values[j], [j, j + 1], { heldValue: key });
          j -= 1;
        }
        if (j + 1 !== i) write(j + 1, key, [j + 1], { heldValue: key });
        markSorted(Array.from({ length: i + 1 }, (_, index) => index));
      }
    } else if (algorithm === 'merge') {
      function merge(left, middle, right) {
        const leftPart = values.slice(left, middle + 1);
        const rightPart = values.slice(middle + 1, right + 1);
        let i = 0;
        let j = 0;
        let k = left;
        while (i < leftPart.length && j < rightPart.length) {
          compare(left + i, middle + 1 + j, { range: [left, right] });
          if (leftPart[i] <= rightPart[j]) {
            write(k, leftPart[i], [left + i, k], { range: [left, right] });
            i += 1;
          } else {
            write(k, rightPart[j], [middle + 1 + j, k], { range: [left, right] });
            j += 1;
          }
          k += 1;
        }
        while (i < leftPart.length) {
          write(k, leftPart[i], [left + i, k], { range: [left, right] });
          i += 1;
          k += 1;
        }
        while (j < rightPart.length) {
          write(k, rightPart[j], [middle + 1 + j, k], { range: [left, right] });
          j += 1;
          k += 1;
        }
      }
      function sort(left, right) {
        if (left >= right) return;
        const middle = Math.floor((left + right) / 2);
        sort(left, middle);
        sort(middle + 1, right);
        merge(left, middle, right);
      }
      sort(0, values.length - 1);
    } else if (algorithm === 'quick') {
      const fixed = new Set();
      function partition(low, high) {
        const pivotValue = values[high];
        let boundary = low;
        for (let scan = low; scan < high; scan += 1) {
          compare(scan, high, { pivot: [high], range: [low, high] });
          if (values[scan] <= pivotValue) {
            swap(boundary, scan, { pivot: [high], range: [low, high] });
            boundary += 1;
          }
        }
        swap(boundary, high, { pivot: [boundary], range: [low, high] });
        fixed.add(boundary);
        markSorted([...fixed], { range: [low, high] });
        return boundary;
      }
      function sort(low, high) {
        if (low >= high) {
          if (low === high) fixed.add(low);
          return;
        }
        const pivotIndex = partition(low, high);
        sort(low, pivotIndex - 1);
        sort(pivotIndex + 1, high);
      }
      sort(0, values.length - 1);
    }

    status = 'Complete';
    markSorted(Array.from({ length: values.length }, (_, index) => index));
    return frames;
  }

  window.SortingAlgorithms = { createSortingSteps };
})();
