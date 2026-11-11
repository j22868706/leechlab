---
title: 'LeetCode Learning Notes: Two Sum, Contains Duplicate, and Valid Anagram'
description: 'Python learning notes on LeetCode 1: Two Sum, 217: Contains Duplicate, and 242: Valid Anagram.'
pubDate: 'Nov 11 2026'
tags: ['leetcode']
heroImage: '../../assets/blog-LeetCode.png'
---

**Topics:** Python, Data Structures, Dictionary, Hash Table, Set

Yesterday, I completed three LeetCode problems:

1. [1. Two Sum](https://leetcode.com/problems/two-sum/)
2. [217. Contains Duplicate](https://leetcode.com/problems/contains-duplicate/)
3. [242. Valid Anagram](https://leetcode.com/problems/valid-anagram/)

Through these problems, I learned more about Python's built-in data structures, especially **Dictionary (Hash Table)** and **Set**, and how they can improve the efficiency of searching for elements.

## 1. Understanding Python Dictionary

A Dictionary (`dict`) is a data structure that stores information as **key-value pairs**.

For example:

```python
d = {
    "apple": 1,
    "banana": 2,
    "orange": 3
}
```

Each key is associated with a value.

One important advantage of using a Dictionary is its fast lookup performance. In Python, dictionaries are implemented using hash tables, which allow us to search for a key in **O(1) time on average**.

This is especially useful for problems like Two Sum, where we need to repeatedly check whether a specific number already exists.

### Common Dictionary Operations

| Operation | Python Syntax | Description |
|---|---|---|
| Create | `d = {}` | Create an empty dictionary |
| Add | `d["a"] = 1` | Add a key-value pair |
| Access | `d["a"]` | Get the value associated with a key |
| Check | `"a" in d` | Check whether a key exists |
| Safe lookup | `d.get("a", 0)` | Return the value, or 0 if the key does not exist |
| Delete | `del d["a"]` | Delete a key-value pair |
| Length | `len(d)` | Get the number of key-value pairs |

### Dictionary vs. List vs. Set

Python provides different built-in data structures.

- **Dictionary `{}`:** Stores data as key-value pairs.
- **List `[]`:** Stores elements in an ordered sequence.
- **Set `set()`:** Stores unique elements without duplicates.

For example:

```python
my_dict = {"a": 1, "b": 2}

my_list = [1, 2, 3, 3]

my_set = {1, 2, 3}
```

Understanding their differences helps me choose an appropriate data structure when solving LeetCode problems.

## 2. LeetCode 1: Two Sum

**Problem:** Given an array of integers `nums` and an integer `target`, return the indices of two numbers that add up to the target.

### My Understanding

My initial idea was to search for two numbers whose sum equals the target.

However, searching through the array repeatedly would be inefficient.

Instead, we can use a **Dictionary (Hash Table)** to store the numbers we have already visited and their corresponding indices.

The idea is:

1. Create an empty dictionary.
2. Loop through the array using `enumerate()` to get both the index and the number.
3. Calculate the difference between the target and the current number.
4. Check whether that difference already exists in the dictionary.
5. If it exists, return the stored index and the current index.
6. Otherwise, store the current number and its index in the dictionary.

### Python Solution

```python
from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        num_map = {}

        for i, num in enumerate(nums):
            complement = target - num

            if complement in num_map:
                return [num_map[complement], i]

            num_map[num] = i

        return []
```

### Key Takeaways

- `enumerate(nums)` returns both the index and the value.
- `num_map[num] = i` stores the number as the key and its index as the value.
- `complement in num_map` checks whether the required number was previously visited.
- We should **check the dictionary before inserting the current number**, so we do not use the same element twice.

**Time Complexity:** O(n) on average

**Space Complexity:** O(n)

Using a Dictionary improves lookup efficiency and allows us to solve the problem in a single pass.

## 3. LeetCode 217: Contains Duplicate

**Problem:** Given an integer array, return `True` if any number appears more than once. Otherwise, return `False`.

### My Understanding

For this problem, I learned that a **Set** is useful because it stores unique elements.

We can create an empty set to keep track of the numbers we have already visited.

For each number:

1. Check whether the number already exists in the set.
2. If it exists, return `True` immediately because a duplicate has been found.
3. Otherwise, add the number to the set.
4. If the entire loop finishes without finding any duplicates, return `False`.

### Python Solution

```python
from typing import List


class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()

        for num in nums:
            if num in seen:
                return True

            seen.add(num)

        return False
```

### Key Takeaways

- `set()` creates an empty set.
- `num in seen` checks whether the number has already been visited.
- `seen.add(num)` adds a number to the set.
- `return True` immediately stops the function when a duplicate is found.
- `return False` should be outside the loop because we need to check all numbers before concluding there are no duplicates.

**Time Complexity:** O(n) on average

**Space Complexity:** O(n)

## 4. LeetCode 242: Valid Anagram

**Problem:** Given two strings `s` and `t`, determine whether `t` is an anagram of `s`.

An anagram means both strings contain the same characters with the same frequency, even if the character order is different.

For example:

```python
s = "anagram"
t = "nagaram"

# Output: True
```

### My Understanding

For this problem, I used a **Dictionary to count the frequency of each character**.

First, I created an empty dictionary and stored the frequency of every character in `s`.

Then, I checked each character in `t` and decreased its count.

If a character does not exist in the dictionary or its count becomes negative, the two strings are not anagrams.

Because the strings have equal lengths, if no count becomes negative after processing all characters in `t`, every count must be zero. No final loop is needed to check the counts.

### Python Solution

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False

        count = {}

        for char in s:
            count[char] = count.get(char, 0) + 1

        for char in t:
            if char not in count:
                return False

            count[char] -= 1

            if count[char] < 0:
                return False

        return True
```

### Understanding `dict.get()`

One important Python expression I learned was:

```python
count[char] = count.get(char, 0) + 1
```

It means:

1. Check whether `char` already exists in the dictionary.
2. If it exists, get its current value.
3. If it does not exist, use `0` as the default value.
4. Add `1` to the value.
5. Store the updated value back in the dictionary.

For example:

```python
s = "aabc"
count = {}

for char in s:
    count[char] = count.get(char, 0) + 1

print(count)
```

Output:

```python
{"a": 2, "b": 1, "c": 1}
```

This approach is useful whenever we need to count how many times an element appears.

**Time Complexity:** O(n + m) on average, where n and m are the string lengths.

**Space Complexity:** O(k), where k is the number of distinct characters stored in the dictionary.

## 5. Summary: What I Learned

After completing these three LeetCode problems, I have a better understanding of how Python's built-in data structures can help improve algorithm efficiency.

| Problem | Data Structure | Main Concept |
|---|---|---|
| Two Sum | Dictionary | Store numbers and indices for fast lookup |
| Contains Duplicate | Set | Track previously visited numbers |
| Valid Anagram | Dictionary | Count character frequencies |

The biggest lesson I learned is that **choosing the right data structure can make a significant difference in algorithm performance**.

Instead of repeatedly searching through a list, I can use a Dictionary or Set to check whether an element exists in O(1) time on average.

These three problems helped me build a foundation in Hash Tables, Sets, and Python Dictionary operations.

I will continue practicing LeetCode and documenting what I learn along the way.
