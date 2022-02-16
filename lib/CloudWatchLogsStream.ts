import {
  CloudWatchLogs,
  CloudWatchLogsClientConfig,
  InputLogEvent
} from '@aws-sdk/client-cloudwatch-logs';
import { castArray } from './helpers';
import { Writable } from 'stream';

const RESOURCE_EXISTS_ERROR_CODE = 'ResourceAlreadyExistsException';

export type CloudWatchStreamOptions = {
  logGroupName: string;
  logStreamName: string;
  cloudWatchLogsOptions: CloudWatchLogsClientConfig;
}

class CloudWatchStream extends Writable {
  #sequenceToken: string | null | undefined;
  #logGroupName: string;
  #logStreamName: string;
  #cloudWatchLogs: CloudWatchLogs;

  constructor(options: CloudWatchStreamOptions) {
    super({ objectMode: true });
    this.#sequenceToken = null;
    this.#logGroupName = options.logGroupName;
    this.#logStreamName = options.logStreamName;
    this.#cloudWatchLogs = new CloudWatchLogs(options.cloudWatchLogsOptions);
  }

  _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    this.processChunk(chunk)
      .then(() => callback())
      .catch(err => callback(err));
  }

  processChunk(chunk: any) {
    const logEvents = castArray(chunk).map(it => ({
      timestamp: it.time,
      message: JSON.stringify(it)
    }));
    return this.createLogGroup()
      .then(() => this.createLogStream())
      .then(() => this.setSequenceToken())
      .then(() => this.putLogEvents(logEvents));
  }

  createLogGroup() {
    const params = { logGroupName: this.#logGroupName };
    return this.#cloudWatchLogs.createLogGroup(params)
      .catch(muteResourceExistsError);
  }

  createLogStream() {
    const params = {
      logGroupName: this.#logGroupName,
      logStreamName: this.#logStreamName
    };
    return this.#cloudWatchLogs.createLogStream(params)
      .catch(muteResourceExistsError);
  }

  setSequenceToken() {
    const params = {
      logGroupName: this.#logGroupName,
      logStreamNamePrefix: this.#logStreamName
    };
    return this.#cloudWatchLogs.describeLogStreams(params)
      .then(({ logStreams }) => {
        const stream = logStreams?.find(it => it.logStreamName === this.#logStreamName);
        if (!stream) {
          throw new Error(`Stream ${this.#logStreamName} does not exist`);
        }
        this.#sequenceToken = stream.uploadSequenceToken;
      });
  }

  putLogEvents(logEvents: InputLogEvent[]) {
    const params = {
      logGroupName: this.#logGroupName,
      logStreamName: this.#logStreamName,
      sequenceToken: this.#sequenceToken || undefined,
      logEvents
    };
    return this.#cloudWatchLogs.putLogEvents(params)
      .then(({ nextSequenceToken }) => {
        this.#sequenceToken = nextSequenceToken;
      });
  }
}

export default CloudWatchStream;

function muteResourceExistsError(err: Error) {
  if (err.name !== RESOURCE_EXISTS_ERROR_CODE) throw err;
}
