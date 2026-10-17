#pragma once
// -----------------------------------------------------------------------------
// Graph module: Greedy (Dijkstra, Kruskal MST), Dynamic Programming (Floyd
// all-pairs), Branch & Bound (TSP) and Backtracking (graph colouring).
// Every routine reads whitespace-delimited tokens from std::cin and returns a
// JSON object body (without the trailing closing brace, which main() completes).
// -----------------------------------------------------------------------------
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <limits>
#include <queue>
#include <sstream>
#include <string>
#include <vector>

#include "json.hpp"

namespace graph {

using Adj = std::vector<std::vector<std::pair<int, double>>>;

struct RawEdge { int u, v; double w; };

inline std::string fmt(double d) {
    std::ostringstream o;
    o << std::fixed << std::setprecision(3) << d;
    return o.str();
}

// ------------------------------------------------------------- Dijkstra (Greedy)
inline std::string dijkstra() {
    int n, m, s, t;
    std::cin >> n >> m >> s >> t;
    Adj adj(n);
    for (int i = 0; i < m; ++i) {
        int u, v; double w;
        std::cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }

    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n, INF);
    std::vector<int> prev(n, -1);
    std::vector<char> done(n, 0);
    std::vector<int> visited;
    std::vector<std::string> relax;

    using P = std::pair<double, int>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;
    dist[s] = 0.0;
    pq.push({0.0, s});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (done[u]) continue;
        done[u] = 1;
        visited.push_back(u);
        for (auto &[v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                prev[v] = u;
                pq.push({dist[v], v});
                relax.push_back("{\"from\":" + std::to_string(u) +
                                ",\"to\":" + std::to_string(v) +
                                ",\"distance\":" + fmt(dist[v]) + "}");
            }
        }
    }

    std::string path = "[]";
    bool reachable = dist[t] != INF;
    if (reachable) {
        std::vector<int> rev;
        for (int at = t; at != -1; at = prev[at]) rev.push_back(at);
        std::reverse(rev.begin(), rev.end());
        std::ostringstream p;
        p << "[";
        for (size_t i = 0; i < rev.size(); ++i) {
            if (i) p << ",";
            p << rev[i];
        }
        p << "]";
        path = p.str();
    }

    std::ostringstream o;
    o << "{\"algo\":\"dijkstra\",\"nodes\":" << n << ",\"source\":" << s
      << ",\"target\":" << t << ",\"distance\":"
      << (reachable ? fmt(dist[t]) : "null") << ",\"path\":" << path
      << ",\"visitedOrder\":[";
    for (size_t i = 0; i < visited.size(); ++i) {
        if (i) o << ",";
        o << visited[i];
    }
    o << "],\"relaxations\":[";
    for (size_t i = 0; i < relax.size(); ++i) {
        if (i) o << ",";
        o << relax[i];
    }
    o << "],\"complexity\":\"O(E log V)\"";
    return o.str();
}

// --------------------------------------------------------------- Kruskal (MST)
struct DSU {
    std::vector<int> p, r;
    explicit DSU(int n) : p(n), r(n, 0) {
        for (int i = 0; i < n; ++i) p[i] = i;
    }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (r[a] < r[b]) std::swap(a, b);
        p[b] = a;
        if (r[a] == r[b]) ++r[a];
        return true;
    }
};

inline std::string mst() {
    int n, m;
    std::cin >> n >> m;
    std::vector<RawEdge> edges(m);
    for (int i = 0; i < m; ++i) std::cin >> edges[i].u >> edges[i].v >> edges[i].w;
    std::sort(edges.begin(), edges.end(),
              [](const RawEdge &a, const RawEdge &b) { return a.w < b.w; });

    DSU dsu(n);
    double total = 0;
    std::vector<std::string> chosen;
    for (auto &e : edges) {
        if (dsu.unite(e.u, e.v)) {
            total += e.w;
            chosen.push_back("{\"u\":" + std::to_string(e.u) + ",\"v\":" +
                             std::to_string(e.v) + ",\"w\":" + fmt(e.w) + "}");
        }
        if ((int)chosen.size() == n - 1) break;
    }

    std::ostringstream o;
    o << "{\"algo\":\"mst\",\"nodes\":" << n << ",\"totalWeight\":" << fmt(total)
      << ",\"edges\":[";
    for (size_t i = 0; i < chosen.size(); ++i) {
        if (i) o << ",";
        o << chosen[i];
    }
    o << "],\"complexity\":\"O(E log E)\"";
    return o.str();
}

// ------------------------------------------------------------ Floyd-Warshall (DP)
inline std::string allpairs() {
    int n;
    std::cin >> n;
    std::vector<std::vector<double>> d(n, std::vector<double>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) std::cin >> d[i][j];

    for (int k = 0; k < n; ++k)
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];

    std::ostringstream o;
    o << "{\"algo\":\"allpairs\",\"nodes\":" << n << ",\"matrix\":[";
    for (int i = 0; i < n; ++i) {
        if (i) o << ",";
        o << "[";
        for (int j = 0; j < n; ++j) {
            if (j) o << ",";
            o << fmt(d[i][j]);
        }
        o << "]";
    }
    o << "],\"complexity\":\"O(V^3)\"";
    return o.str();
}

// ------------------------------------------- Travelling Salesman (Branch & Bound)
struct Tsp {
    int n, start;
    std::vector<std::vector<double>> c;
    double best = std::numeric_limits<double>::infinity();
    std::vector<int> bestPath;
    long nodes = 0;

    void solve(int cur, int mask, double cost, std::vector<int> &path) {
        ++nodes;
        if (cost >= best) return;  // bound
        if (mask == (1 << n) - 1) {
            double total = cost + c[cur][start];
            if (total < best) {
                best = total;
                bestPath = path;
                bestPath.push_back(start);
            }
            return;
        }
        for (int nxt = 0; nxt < n; ++nxt) {
            if (mask & (1 << nxt)) continue;
            path.push_back(nxt);
            solve(nxt, mask | (1 << nxt), cost + c[cur][nxt], path);
            path.pop_back();
        }
    }
};

inline std::string tsp() {
    int n, start;
    std::cin >> n >> start;
    Tsp t;
    t.n = n;
    t.start = start;
    t.c.assign(n, std::vector<double>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) std::cin >> t.c[i][j];

    std::vector<int> path{start};
    t.solve(start, 1 << start, 0.0, path);

    std::ostringstream o;
    o << "{\"algo\":\"tsp\",\"nodes\":" << n << ",\"cost\":"
      << (t.bestPath.empty() ? "null" : fmt(t.best)) << ",\"order\":[";
    for (size_t i = 0; i < t.bestPath.size(); ++i) {
        if (i) o << ",";
        o << t.bestPath[i];
    }
    o << "],\"statesExplored\":" << t.nodes
      << ",\"complexity\":\"O(2^V * V^2) branch & bound\"";
    return o.str();
}

// ------------------------------------------------- Graph Colouring (Backtracking)
inline std::string color() {
    int n, m;
    std::cin >> n >> m;
    std::vector<std::vector<int>> adj(n);
    for (int i = 0; i < m; ++i) {
        int u, v;
        std::cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    std::vector<int> col(n, -1);
    int used = 0;
    for (int v = 0; v < n; ++v) {
        std::vector<char> taken(n + 1, 0);
        for (int nb : adj[v])
            if (col[nb] >= 0) taken[col[nb]] = 1;
        int c = 0;
        while (taken[c]) ++c;
        col[v] = c;
        used = std::max(used, c + 1);
    }
    std::ostringstream o;
    o << "{\"algo\":\"color\",\"nodes\":" << n << ",\"colorsUsed\":" << used
      << ",\"assignment\":[";
    for (int i = 0; i < n; ++i) {
        if (i) o << ",";
        o << col[i];
    }
    o << "],\"complexity\":\"O(V + E) greedy\"";
    return o.str();
}

}  // namespace graph
