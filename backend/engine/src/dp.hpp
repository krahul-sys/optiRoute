#pragma once
// -----------------------------------------------------------------------------
// Dynamic Programming module: 0/1 Knapsack and Longest Common Subsequence.
// -----------------------------------------------------------------------------
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "json.hpp"

namespace dp {

inline std::string fmt(double d) {
    std::ostringstream o;
    o << std::fixed << std::setprecision(3) << d;
    return o.str();
}

// ------------------------------------------------------- 0/1 Knapsack (DP table)
// Input:  N capacity
//         id weight value   (N lines)
inline std::string knapsack() {
    int n;
    double cap;
    std::cin >> n >> cap;
    int capacity = static_cast<int>(cap);
    std::vector<int> id(n), weight(n);
    std::vector<double> value(n);
    for (int i = 0; i < n; ++i) std::cin >> id[i] >> weight[i] >> value[i];

    std::vector<std::vector<double>> table(n + 1, std::vector<double>(capacity + 1, 0.0));
    for (int i = 1; i <= n; ++i) {
        for (int w = 0; w <= capacity; ++w) {
            table[i][w] = table[i - 1][w];
            if (weight[i - 1] <= w) {
                double take = table[i - 1][w - weight[i - 1]] + value[i - 1];
                if (take > table[i][w]) table[i][w] = take;
            }
        }
    }

    // Backtrack the chosen set.
    std::vector<int> chosen;
    double totW = 0;
    int w = capacity;
    for (int i = n; i > 0; --i) {
        if (table[i][w] != table[i - 1][w]) {
            chosen.push_back(i - 1);
            w -= weight[i - 1];
            totW += weight[i - 1];
        }
    }
    std::reverse(chosen.begin(), chosen.end());

    std::ostringstream o;
    o << "{\"algo\":\"knapsack\",\"capacity\":" << capacity
      << ",\"totalValue\":" << fmt(table[n][capacity])
      << ",\"totalWeight\":" << fmt(totW) << ",\"selectedIds\":[";
    for (size_t i = 0; i < chosen.size(); ++i) {
        if (i) o << ",";
        o << id[chosen[i]];
    }
    o << "],\"selectedIndexes\":[";
    for (size_t i = 0; i < chosen.size(); ++i) {
        if (i) o << ",";
        o << chosen[i];
    }
    o << "],\"complexity\":\"O(N*W)\"";
    return o.str();
}

// ---------------------------------------------------------------- LCS (DP table)
// Input: two whitespace-free strings on separate lines.
inline std::string lcs() {
    std::string a, b;
    std::cin >> a >> b;
    size_t n = a.size(), m = b.size();
    std::vector<std::vector<int>> t(n + 1, std::vector<int>(m + 1, 0));
    for (size_t i = 1; i <= n; ++i)
        for (size_t j = 1; j <= m; ++j)
            t[i][j] = (a[i - 1] == b[j - 1])
                          ? t[i - 1][j - 1] + 1
                          : std::max(t[i - 1][j], t[i][j - 1]);

    std::string seq;
    size_t i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            seq.push_back(a[i - 1]);
            --i; --j;
        } else if (t[i - 1][j] >= t[i][j - 1]) {
            --i;
        } else {
            --j;
        }
    }
    std::reverse(seq.begin(), seq.end());

    std::ostringstream o;
    o << "{\"algo\":\"lcs\",\"length\":" << t[n][m]
      << ",\"sequence\":" << json::str(seq) << ",\"complexity\":\"O(N*M)\"";
    return o.str();
}

}  // namespace dp
