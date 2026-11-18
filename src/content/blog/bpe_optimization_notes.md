---
title: 'BPE Training Optimization — CS336 Assignment 1 Learning Notes'
description: 'Learning how to speed up BPE training with a pair index and incremental frequency updates in CS336 Assignment 1.'
pubDate: 'Nov 17 2026'
tags: ['cs336', 'bpe']
---

**Topics:** Byte Pair Encoding, Pre-tokenization, Pair Frequencies, Incremental Updates

In CS336 Assignment 1, I optimized my Byte Pair Encoding (BPE) trainer in two steps. I first used a pair index to limit which sequences each merge had to visit. Then I kept the pair frequencies and index across rounds and updated them as sequences changed.

## 1. Training Time

I used the inputs from the speed test: `corpus.en`, a vocabulary size of 500, and the special token `<|endoftext|>`. The timings cover the full `run_train_bpe` call, including file reading, pre-tokenization, and merging.

| Version | Training time | Compared with the previous version |
| --- | ---: | ---: |
| Baseline, recount pair frequencies and attempt to merge every sequence in each round | 1.507 s | Baseline |
| Rebuild the pair index each round and merge only affected sequences | 1.537 s | 0.030 s slower |
| Update pair frequencies and the index incrementally | 0.144 s (median of five runs) | 1.393 s faster |

The final version took about **1.363 seconds less** than the baseline, a **90.4% reduction** in training time. The speed test requires a runtime strictly below 1.5 seconds. The final median was about 1.356 seconds below that threshold.

The first two timings came from one earlier speed test per version, at 1.506852 and 1.537235 seconds. For the final version, I used the project's virtual environment and timed five consecutive runs with `perf_counter()` in the same Python process. The runs took 0.158, 0.140, 0.143, 0.518, and 0.144 seconds, in that order. The observed differences reflect both the code changes and runtime variation. The 1.17 seconds reported for the full test file covered all three tests.

## 2. Use a Pair Index to Limit Merges

In each round, the baseline visited every distinct pre-tokenized sequence to count adjacent pairs, then called `merge_pair` on every sequence. Each occurrence of a pair contributed the sequence's frequency. For example, if `(b'a', b'a', b'a')` occurs three times, it contributes 6 to the count for `(b'a', b'a')` because the pair appears at two adjacent positions.

```python
# Run after selecting best_pair in each round.
new_byte_counts = defaultdict(int)
for token, freq in byte_counts.items():
    merged_token = merge_pair(token, best_pair)
    new_byte_counts[merged_token] += freq
byte_counts = new_byte_counts
```

In the first optimization, I built a pair index while counting frequencies at the start of each round.

- For each pair, `pair_to_tokens` stores a set of the full sequences that contain it. A sequence appears in the set once, even if the pair occurs at several positions.
- After selecting `best_pair`, I iterate over its set and use `byte_counts.pop(token)` to retrieve each affected sequence's frequency. Unaffected sequences stay in `byte_counts`.
- I accumulate the merge results in a temporary dictionary and wait until all affected old sequences have been processed before adding the results back with `+=`. This preserves the total frequency when a merged sequence shares a key with an existing sequence or when several merges produce the same key.

```python
# Recount pairs at the start of each round.
pair_counts = defaultdict(int)
pair_to_tokens = defaultdict(set)
for token, freq in byte_counts.items():
    for i in range(len(token) - 1):
        pair = (token[i], token[i + 1])
        pair_counts[pair] += freq
        pair_to_tokens[pair].add(token)

# After selecting best_pair and recording the merge, process only the indexed sequences.
new_byte_counts = defaultdict(int)
for token in pair_to_tokens[best_pair]:
    freq = byte_counts.pop(token)
    merged_token = merge_pair(token, best_pair)
    new_byte_counts[merged_token] += freq

for merged_token, freq in new_byte_counts.items():
    byte_counts[merged_token] += freq
```

This version skipped merge scans on unaffected sequences, but it still visited every sequence and rebuilt the index in each round. In the recorded run, it was about 0.030 seconds slower.

## 3. Keep Pair Frequencies and the Index Across Rounds

I moved the initial full scan for `pair_counts` and `pair_to_tokens` before the `while` loop. Each round then updates only the entries affected by the merge.

- Remove the set for `best_pair` from the index and delete its total frequency. Skip `best_pair` in the inner loop to avoid mutating the set being iterated over or subtracting that pair's frequency again.
- For each affected old sequence, subtract its frequency at every adjacent position and update the index with `.discard(token)`. If a pair occurs more than once, each occurrence needs its own subtraction. Calling `.discard(token)` more than once is safe.
- For each merged sequence, add its newly contributed frequency at every adjacent position and add the full sequence to the corresponding sets.
- Delete a pair's count and index entry as soon as its count reaches zero. This avoids a full cleanup pass after every round. Each round still uses `max` to select the most frequent pair, breaking ties by choosing the lexicographically largest pair.

The final version took about 1.393 seconds less than the version that rebuilt the index each round. This difference measures the incremental updates together. I did not time immediate cleanup or the other changes individually.

The training loop below uses the same initial counting pass as the previous version, moved before the loop. Inside the loop, `freq` is the contribution at each adjacent position in an old sequence being removed or a merged sequence being added in that round.

```python
while len(vocab) < vocab_size:
    if not pair_counts:
        break

    best_pair = max(
        pair_counts,
        key=lambda pair: (pair_counts[pair], pair)
    )
    merges.append(best_pair)
    merged_bytes = best_pair[0] + best_pair[1]
    vocab[len(vocab)] = merged_bytes

    affected = pair_to_tokens.pop(best_pair)
    del pair_counts[best_pair]

    new_byte_counts = defaultdict(int)
    for token in affected:
        freq = byte_counts.pop(token)
        for i in range(len(token) - 1):
            pair = (token[i], token[i + 1])
            if pair == best_pair:
                continue
            pair_counts[pair] -= freq
            pair_to_tokens[pair].discard(token)
            if pair_counts[pair] == 0:
                del pair_counts[pair]
                del pair_to_tokens[pair]
        merged_token = merge_pair(token, best_pair)
        new_byte_counts[merged_token] += freq

    for merged_token, freq in new_byte_counts.items():
        byte_counts[merged_token] += freq
        for i in range(len(merged_token) - 1):
            pair = (merged_token[i], merged_token[i + 1])
            pair_counts[pair] += freq
            pair_to_tokens[pair].add(merged_token)
```

## 4. Verification

All three tests in `tests/test_train_bpe.py` passed. They cover the reference merge order and vocabulary, special tokens, and the 1.5-second speed threshold.

```sh
.venv/bin/python -m pytest tests/test_train_bpe.py -q
```
