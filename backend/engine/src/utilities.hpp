#pragma once
// -----------------------------------------------------------------------------
// Core utilities module: Divide & Conquer sorting (Merge/Quick) and Greedy
// Huffman coding for log compression.
// -----------------------------------------------------------------------------
#include <algorithm>
#include <iostream>
#include <queue>
#include <sstream>
#include <string>
#include <vector>

#include "json.hpp"

namespace utilities {

struct Row { int id; double value; };

inline std::string fmt(double d) {
    std::ostringstream o;
    o << std::fixed << std::setprecision(3) << d;
    return o.str();
}

inline std::vector<Row> readRows(int &n) {
    std::cin >> n;
    std::vector<Row> rows(n);
    for (int i = 0; i < n; ++i) std::cin >> rows[i].id >> rows[i].value;
    return rows;
}

// ------------------------------------------------------------- Merge Sort (D&C)
inline void mergeSort(std::vector<Row> &a, long &cmp, int l, int r) {
    if (r - l <= 1) return;
    int mid = l + (r - l) / 2;
    mergeSort(a, cmp, l, mid);
    mergeSort(a, cmp, mid, r);
    std::vector<Row> tmp;
    tmp.reserve(r - l);
    int i = l, j = mid;
    while (i < mid && j < r) {
        ++cmp;
        if (a[i].value <= a[j].value) tmp.push_back(a[i++]);
        else tmp.push_back(a[j++]);
    }
    while (i < mid) tmp.push_back(a[i++]);
    while (j < r) tmp.push_back(a[j++]);
    for (int k = 0; k < (int)tmp.size(); ++k) a[l + k] = tmp[k];
}

inline std::string mergesort() {
    int n;
    auto rows = readRows(n);
    long cmp = 0;
    mergeSort(rows, cmp, 0, (int)rows.size());
    std::ostringstream o;
    o << "{\"algo\":\"mergesort\",\"rows\":[";
    for (size_t i = 0; i < rows.size(); ++i) {
        if (i) o << ",";
        o << "{\"id\":" << rows[i].id << ",\"value\":" << fmt(rows[i].value) << "}";
    }
    o << "],\"comparisons\":" << cmp << ",\"complexity\":\"O(N log N)\"";
    return o.str();
}

// ------------------------------------------------------------- Quick Sort (D&C)
inline void quickSort(std::vector<Row> &a, long &cmp, int lo, int hi) {
    if (lo >= hi) return;
    double pivot = a[lo + (hi - lo) / 2].value;
    int i = lo, j = hi;
    while (i <= j) {
        while (++cmp && a[i].value < pivot) ++i;
        while (++cmp && a[j].value > pivot) --j;
        if (i <= j) {
            std::swap(a[i], a[j]);
            ++i;
            --j;
        }
    }
    quickSort(a, cmp, lo, j);
    quickSort(a, cmp, i, hi);
}

inline std::string quicksort() {
    int n;
    auto rows = readRows(n);
    long cmp = 0;
    if (!rows.empty()) quickSort(rows, cmp, 0, (int)rows.size() - 1);
    std::ostringstream o;
    o << "{\"algo\":\"quicksort\",\"rows\":[";
    for (size_t i = 0; i < rows.size(); ++i) {
        if (i) o << ",";
        o << "{\"id\":" << rows[i].id << ",\"value\":" << fmt(rows[i].value) << "}";
    }
    o << "],\"comparisons\":" << cmp << ",\"complexity\":\"O(N log N) average\"";
    return o.str();
}

// --------------------------------------------------------- Huffman (Greedy)
struct HNode {
    char ch;
    int freq;
    HNode *l;
    HNode *r;
    HNode(char c, int f) : ch(c), freq(f), l(nullptr), r(nullptr) {}
};

struct Cmp {
    bool operator()(HNode *a, HNode *b) const { return a->freq > b->freq; }
};

inline void buildCodes(HNode *n, std::string code, std::vector<std::pair<char, std::string>> &out) {
    if (!n) return;
    if (!n->l && !n->r) {
        out.push_back({n->ch, code.empty() ? "0" : code});
        return;
    }
    buildCodes(n->l, code + "0", out);
    buildCodes(n->r, code + "1", out);
}

inline std::string huffman() {
    std::string text;
    std::getline(std::cin, text);  // consume rest of line after the marker
    if (text.empty()) std::getline(std::cin, text);

    int freq[256] = {0};
    for (unsigned char c : text) freq[c]++;

    std::priority_queue<HNode *, std::vector<HNode *>, Cmp> pq;
    for (int i = 0; i < 256; ++i)
        if (freq[i]) pq.push(new HNode((char)i, freq[i]));

    if (pq.empty()) {
        return "{\"algo\":\"huffman\",\"rawBytes\":0,\"compressedBytes\":0,"
               "\"bandwidthSavedPercent\":0,\"codes\":[]}";
    }

    while (pq.size() > 1) {
        HNode *a = pq.top(); pq.pop();
        HNode *b = pq.top(); pq.pop();
        HNode *merged = new HNode('\0', a->freq + b->freq);
        merged->l = a;
        merged->r = b;
        pq.push(merged);
    }
    HNode *root = pq.top();

    std::vector<std::pair<char, std::string>> codes;
    buildCodes(root, "", codes);

    long long compressedBits = 0;
    for (unsigned char c : text)
        for (auto &p : codes)
            if ((unsigned char)p.first == c) { compressedBits += p.second.size(); break; }

    long long rawBytes = (long long)text.size();
    long long compBytes = (compressedBits + 7) / 8;
    double saved = rawBytes > 0 ? (1.0 - (double)compBytes / (double)rawBytes) * 100.0 : 0.0;

    std::ostringstream o;
    o << "{\"algo\":\"huffman\",\"rawBytes\":" << rawBytes
      << ",\"compressedBytes\":" << compBytes
      << ",\"compressedBits\":" << compressedBits
      << ",\"bandwidthSavedPercent\":" << fmt(saved)
      << ",\"uniqueSymbols\":" << codes.size() << ",\"codes\":[";
    for (size_t i = 0; i < codes.size(); ++i) {
        if (i) o << ",";
        std::string ch(1, codes[i].first);
        o << "{\"char\":" << json::str(ch) << ",\"code\":"
          << json::str(codes[i].second) << ",\"freq\":" << freq[(unsigned char)codes[i].first]
          << "}";
    }
    o << "],\"complexity\":\"O(N log K)\"";
    return o.str();
}

}  // namespace utilities
