// =============================================================================
// OptiRoute DAA Engine
// -----------------------------------------------------------------------------
// A stateless, native C++ computation service. It reads a runtime algorithm
// selector from argv, consumes structured tokens from stdin, executes the
// hand-coded algorithm in volatile RAM, and prints a single JSON object to
// stdout before terminating (freeing 100% of its memory footprint).
//
//   engine --algo=dijkstra   < input.txt   > result.json
// =============================================================================
#include <chrono>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

#include "graph.hpp"
#include "dp.hpp"
#include "trees.hpp"
#include "utilities.hpp"

namespace {

std::string withTiming(const std::string &body, double ms) {
    std::string out = body;
    if (!out.empty() && out.back() == '}') out.pop_back();
    std::ostringstream o;
    o << out << ",\"executionMs\":" << std::fixed << std::setprecision(4) << ms << "}";
    return o.str();
}

std::string runAlgo(const std::string &algo) {
    if (algo == "dijkstra")  return graph::dijkstra();
    if (algo == "mst")       return graph::mst();
    if (algo == "allpairs")  return graph::allpairs();
    if (algo == "tsp")       return graph::tsp();
    if (algo == "color")     return graph::color();
    if (algo == "knapsack")  return dp::knapsack();
    if (algo == "lcs")       return dp::lcs();
    if (algo == "avl")       return trees::avl();
    if (algo == "heap")      return trees::heap();
    if (algo == "mergesort") return utilities::mergesort();
    if (algo == "quicksort") return utilities::quicksort();
    if (algo == "huffman")   return utilities::huffman();
    return "{\"error\":" + json::str("unknown algorithm: " + algo) + "}";
}

}  // namespace

int main(int argc, char **argv) {
    std::ios::sync_with_stdio(false);
    std::string algo = "dijkstra";
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        auto pos = arg.find("--algo=");
        if (pos != std::string::npos) algo = arg.substr(pos + 7);
    }

    auto start = std::chrono::high_resolution_clock::now();
    std::string body = runAlgo(algo);
    auto end = std::chrono::high_resolution_clock::now();
    double ms = std::chrono::duration<double, std::milli>(end - start).count();

    std::cout << withTiming(body, ms) << std::endl;
    return 0;
}
