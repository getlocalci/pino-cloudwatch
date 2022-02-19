import build from 'pino-abstract-transport';
import CloudWatchStream, { CloudWatchStreamOptions } from './CloudWatchLogsStream';
import ChunkifyStream, { ChunkifyStreamOptions } from './ChunkifyStream';
import { pipeline } from 'stream/promises';

type Options = CloudWatchStreamOptions & ChunkifyStreamOptions;

function createCloudWatchLogsTransport(options: Options) {
  const chunkify = new ChunkifyStream(options);
  const cloudWatch = new CloudWatchStream(options);
  return build(source => pipeline(source, chunkify, cloudWatch), {
    close(err: Error, cb: Function) {
      if (err) return cb(err);
      cloudWatch.on('close', () => cb())
    }
  });
}

// This needs to be exported like this in order to work
// https://github.com/pinojs/pino/issues/1243
export = createCloudWatchLogsTransport;
