// @ts-check

const tiles = /**
* @type {const}
*/([
    ['clear', 'cloudy start', 'cloudy 1', 'cloudy 2', 'cloudy end 1'],
    ['clear', 'fair', 'cloudy end 2'],
    ['clear', 'heavy rain start', 'heavy rain 1', 'heavy rain 2'],
    ['clear', 'thunder start', 'thunder 1', 'thunder 2'],
    ['clear', 'light rain start', 'light rain 1', 'light rain 2'],
  ]);

/**
 *
 * @param {typeof tiles[number][number]} tile
 * @returns {[number, number]}
 */
function tilePos(tile) {
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles.length; x++) {
      if (tiles[y][x] == tile) return [x, y];
    }
  }

  return [0, 0];
}


/**
 * @returns {(next: 'clear'|'cloudy'|'heavy rain'|'light rain'|'fair'|'thunder') => [number, number]} mapper
 */
export default function getTiles() {
  let cloudyness = 0;

  return next => {
    if (next == 'clear') {
      if (cloudyness == 0) {
        return tilePos('clear');
      } else {
        cloudyness = 0;
        return tilePos(Math.random() > 0.5 ? 'cloudy end 1' : 'cloudy end 2');
      }
    }

    if (next == 'cloudy' || next == 'heavy rain' || next == 'light rain' || next == 'thunder') {
      if (cloudyness == 0) {
        cloudyness++;
        return tilePos(`${next} start`);
      } else {
        cloudyness++;
        return tilePos(`${next} ${Math.random() > 0.5 ? '1' : '2'}`);
      }
    }

    if (next == 'fair') {
      if (cloudyness == 0) {
        cloudyness = 1;
        return tilePos('fair');
      } else {
        cloudyness = 0;
        return tilePos('cloudy end 2');
      }
    }

    return tilePos('clear');
  };
}
