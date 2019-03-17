import {
  FLUSH,
} from '../../actions/types';

export function flush(iCloudSync) {
  return {
    type: FLUSH,
    iCloudSync,
  };
}

export default {
  flush,
};
