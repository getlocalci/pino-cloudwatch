import test from 'ava';
import ChunkifyStream from '../lib/chunkify-stream';
import { pipeline } from 'stream/promises';
import streamTest from 'streamtest';

test('should return buffered chunks on interval timeout', async t => {
  const chunkify = new ChunkifyStream({ bufferLength: 10, interval: 100 });
  const chunks = ['1st', '2nd', '3rd', '4th'];
  await pipeline(
    streamTest.v2.fromChunks(chunks),
    chunkify,
    streamTest.v2.toObjects((_err, data: any[]) => {
      t.is(data[0].length, chunks.length);
    })
  );
});

test('should return multiple chunks when chunk count is higher than buffer length', async t => {
  const bufferLength = 2;
  const chunkify = new ChunkifyStream({ bufferLength, interval: 100 });
  const chunks = ['1st', '2nd', '3rd', '4th'];
  await pipeline(
    streamTest.v2.fromChunks(chunks),
    chunkify,
    streamTest.v2.toObjects((_err, data: any[]) => {
      data.forEach(chunk => t.is(chunk.length, bufferLength));
    })
  );
});

test('should return one chunk at the time when the interval is set to 0', async t => {
  const chunkify = new ChunkifyStream({ bufferLength: 4, interval: 0 });
  const chunks = ['1st', '2nd', '3rd', '4th'];
  await pipeline(
    streamTest.v2.fromChunks(chunks),
    chunkify,
    streamTest.v2.toObjects((_err, data: any[]) => {
      data.forEach(chunk => t.is(chunk.length, 1));
    })
  );
});

test('should return two chunks at the time when the interval is as twice as long as readable stream speed', async t => {
  const chunkify = new ChunkifyStream({ bufferLength: 10, interval: 100 });
  const chunks = ['1st', '2nd', '3rd', '4th'];
  await pipeline(
    streamTest.v2.fromChunks(chunks, 50),
    chunkify,
    streamTest.v2.toObjects((_err, data: any[]) => {
      data.forEach(chunk => t.is(chunk.length, 2));
    })
  );
});
