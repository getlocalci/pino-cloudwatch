import build from 'pino-abstract-transport';
import CloudWatchStream, { CloudWatchStreamOptions } from './CloudWatchLogsStream';

function createCloudWatchLogsTransport(options: CloudWatchStreamOptions) {
  const stream = new CloudWatchStream(options);
  return build(source => {
    source.pipe(stream);
  }, {
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
