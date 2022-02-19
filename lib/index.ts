import build from 'pino-abstract-transport';
import CloudWatchStream, { CloudWatchStreamOptions } from './CloudWatchLogsStream';
import Chunkify, { ChunkifyOptions } from './Chunkify';
import { pipeline } from 'stream/promises';

type Options = CloudWatchStreamOptions & ChunkifyOptions;

function createCloudWatchLogsTransport(options: Options) {
  const chunkify = new Chunkify(options);
  const stream = new CloudWatchStream(options);
  return build(source => pipeline(source, chunkify, stream), {
    close(err: Error, cb: Function) {
      if (err) return cb(err);
      stream.on('close', () => {
        cb();
      })
    }
  });
}

// This needs to be exported like this in order to work
// https://github.com/pinojs/pino/issues/1243
export = createCloudWatchLogsTransport;
