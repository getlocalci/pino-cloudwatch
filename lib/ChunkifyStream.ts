import { Transform, TransformCallback } from 'stream';

export type ChunkifyStreamOptions = {
  interval?: number;
  bufferLength?: number;
};

const defaultOptions = {
  interval: 1000, // 1s
  bufferLength: 50
};

class ChunkifyStream extends Transform {
  #buffer: any[];
  #timeoutId: NodeJS.Timeout | null;
  #interval: number;
  #bufferLength: number;

  constructor(options: ChunkifyStreamOptions = {}) {
    super({ objectMode: true });
    const mergedOptions = Object.assign({}, defaultOptions, options);
    this.#timeoutId = null;
    this.#buffer = [];
    this.#interval = mergedOptions.interval;
    this.#bufferLength = mergedOptions.bufferLength;
  }

  _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.#buffer.push(chunk);
    if (this.#buffer.length >= this.#bufferLength) this.flush();
    if (this.#interval && !this.#timeoutId) {
      this.#timeoutId = setTimeout(() => this.flush(), this.#interval);
    }
    callback();
  }

  _flush(callback: TransformCallback) {
    this.flush();
    callback();
  }

  private flush() {
    this.clearTimeout();
    if (!this.#buffer.length) return;
    this.push(this.#buffer);
    this.#buffer = [];
  }

  private clearTimeout() {
    if (!this.#timeoutId) return;
    clearTimeout(this.#timeoutId);
    this.#timeoutId = null;
  }
}

export default ChunkifyStream;
