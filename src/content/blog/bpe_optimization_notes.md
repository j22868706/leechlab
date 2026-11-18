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

In each round, the baseline visited every distinct pre-tokenized sequence to count adjacent pairs, then attempted to merge the selected pair in every sequence. Each occurrence of a pair contributed the sequence's frequency. For example, if the sequence `a a a` occurs three times, it contributes 6 to the count for `a a` because the pair appears at two adjacent positions.

In my first optimization, I built an index from each pair to the distinct sequences that contain it. A sequence appears once in the index for a given pair, even when the pair occurs at multiple positions. After selecting a pair, I used the index to visit only the sequences containing it. When several sequences merge into the same result, their frequencies need to be added together.

This version skipped merge scans on unaffected sequences, but it still visited every sequence to rebuild the index in each round. In the recorded run, it was about 0.030 seconds slower.

## 3. Keep Pair Frequencies and the Index Across Rounds

I built the pair counts and index once, then treated each merge as a local change to both. The main idea is to subtract the old sequences' contributions and add the merged sequences' contributions.

```text
Before training
    Count adjacent pairs and index the sequences that contain them.

For each merge round
    Choose the most frequent pair and look up its affected sequences.
    Remove those sequences' contributions from the counts and index.
    Merge the pair in those sequences and add their new contributions.
```

The counts and the index track different things. Counts track every adjacent occurrence, weighted by the sequence's frequency. The index tracks which distinct sequences contain a pair. Keeping that distinction matters when a pair occurs multiple times in one sequence. I also removed entries when their counts reached zero to avoid a full cleanup pass each round. When pairs had the same count, training still chose the lexicographically largest pair.

The final version took about 1.393 seconds less than the version that rebuilt the index each round. This difference reflects the incremental changes together. The benchmark did not measure the individual effect of removing zero-count entries.
