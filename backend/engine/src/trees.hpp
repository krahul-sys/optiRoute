#pragma once
// -----------------------------------------------------------------------------
// Trees & Heaps module: self-balancing AVL tree (with rotation trace) and a
// binary-array Max-Heap priority queue (with bubble-up trace).
// -----------------------------------------------------------------------------
#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "json.hpp"

namespace trees {

// ------------------------------------------------------------------ AVL Tree
struct AVLNode {
    int key, height;
    AVLNode *left = nullptr, *right = nullptr;
    explicit AVLNode(int k) : key(k), height(1) {}
};

inline int h(AVLNode *n) { return n ? n->height : 0; }
inline int balanceFactor(AVLNode *n) { return n ? h(n->left) - h(n->right) : 0; }

inline void refresh(AVLNode *n) {
    n->height = std::max(h(n->left), h(n->right)) + 1;
}

inline AVLNode *rotateRight(AVLNode *y, std::vector<std::string> &log) {
    AVLNode *x = y->left;
    AVLNode *t2 = x->right;
    x->right = y;
    y->left = t2;
    refresh(y);
    refresh(x);
    log.push_back("{\"rotation\":\"RIGHT\",\"pivot\":" + std::to_string(y->key) +
                  ",\"case\":\"LL\"}");
    return x;
}

inline AVLNode *rotateLeft(AVLNode *x, std::vector<std::string> &log) {
    AVLNode *y = x->right;
    AVLNode *t2 = y->left;
    y->left = x;
    x->right = t2;
    refresh(x);
    refresh(y);
    log.push_back("{\"rotation\":\"LEFT\",\"pivot\":" + std::to_string(x->key) +
                  ",\"case\":\"RR\"}");
    return y;
}

inline AVLNode *insert(AVLNode *node, int key, std::vector<std::string> &log) {
    if (!node) return new AVLNode(key);
    if (key < node->key)
        node->left = insert(node->left, key, log);
    else if (key > node->key)
        node->right = insert(node->right, key, log);
    else
        return node;  // duplicate keys ignored

    refresh(node);
    int bf = balanceFactor(node);

    if (bf > 1 && key < node->left->key)
        return rotateRight(node, log);
    if (bf < -1 && key > node->right->key)
        return rotateLeft(node, log);
    if (bf > 1 && key > node->left->key) {
        node->left = rotateLeft(node->left, log);
        log.push_back("{\"rotation\":\"LEFT-RIGHT\",\"pivot\":" +
                      std::to_string(node->key) + ",\"case\":\"LR\"}");
        return rotateRight(node, log);
    }
    if (bf < -1 && key < node->right->key) {
        node->right = rotateRight(node->right, log);
        log.push_back("{\"rotation\":\"RIGHT-LEFT\",\"pivot\":" +
                      std::to_string(node->key) + ",\"case\":\"RL\"}");
        return rotateLeft(node, log);
    }
    return node;
}

inline AVLNode *minNode(AVLNode *n) {
    while (n->left) n = n->left;
    return n;
}

inline AVLNode *erase(AVLNode *node, int key, std::vector<std::string> &log) {
    if (!node) return nullptr;
    if (key < node->key)
        node->left = erase(node->left, key, log);
    else if (key > node->key)
        node->right = erase(node->right, key, log);
    else {
        if (!node->left || !node->right) {
            AVLNode *child = node->left ? node->left : node->right;
            delete node;
            return child;
        }
        AVLNode *succ = minNode(node->right);
        node->key = succ->key;
        node->right = erase(node->right, succ->key, log);
    }
    refresh(node);
    int bf = balanceFactor(node);
    if (bf > 1 && balanceFactor(node->left) >= 0) return rotateRight(node, log);
    if (bf < -1 && balanceFactor(node->right) <= 0) return rotateLeft(node, log);
    if (bf > 1 && balanceFactor(node->left) < 0) {
        node->left = rotateLeft(node->left, log);
        return rotateRight(node, log);
    }
    if (bf < -1 && balanceFactor(node->right) > 0) {
        node->right = rotateRight(node->right, log);
        return rotateLeft(node, log);
    }
    return node;
}

inline void toJson(AVLNode *n, std::ostringstream &o) {
    if (!n) {
        o << "null";
        return;
    }
    o << "{\"key\":" << n->key << ",\"height\":" << n->height
      << ",\"bf\":" << balanceFactor(n) << ",\"left\":";
    toJson(n->left, o);
    o << ",\"right\":";
    toJson(n->right, o);
    o << "}";
}

inline int height(AVLNode *n) { return n ? n->height : 0; }

// Input:  N
//         op key   (op = I to insert, D to delete)
inline std::string avl() {
    int n;
    std::cin >> n;
    AVLNode *root = nullptr;
    std::vector<std::string> log;
    std::vector<int> inserted;
    for (int i = 0; i < n; ++i) {
        char op;
        int key;
        std::cin >> op >> key;
        if (op == 'D' || op == 'd')
            root = erase(root, key, log);
        else {
            root = insert(root, key, log);
            inserted.push_back(key);
        }
    }
    std::ostringstream t;
    toJson(root, t);
    std::ostringstream o;
    o << "{\"algo\":\"avl\",\"insertedKeys\":[";
    for (size_t i = 0; i < inserted.size(); ++i) {
        if (i) o << ",";
        o << inserted[i];
    }
    o << "],\"treeHeight\":" << height(root) << ",\"rotations\":[";
    for (size_t i = 0; i < log.size(); ++i) {
        if (i) o << ",";
        o << log[i];
    }
    o << "],\"tree\":" << t.str() << ",\"complexity\":\"O(log N) per op\"";
    return o.str();
}

// ----------------------------------------------------------------- Max-Heap
// Input:  N
//         id priority   (N lines)
inline std::string heap() {
    int n;
    std::cin >> n;
    std::vector<int> id(n), prio(n);
    for (int i = 0; i < n; ++i) std::cin >> id[i] >> prio[i];

    struct Item { int id, prio; };
    std::vector<Item> arr;
    std::vector<std::string> steps;
    for (int i = 0; i < n; ++i) {
        arr.push_back({id[i], prio[i]});
        int c = static_cast<int>(arr.size()) - 1;
        while (c > 0) {
            int p = (c - 1) / 2;
            if (arr[p].prio >= arr[c].prio) break;
            steps.push_back("{\"action\":\"swap-up\",\"child\":" + std::to_string(c) +
                            ",\"parent\":" + std::to_string(p) + ",\"id\":" +
                            std::to_string(arr[c].id) + "}");
            std::swap(arr[p], arr[c]);
            c = p;
        }
        steps.push_back("{\"action\":\"insert\",\"index\":" +
                        std::to_string(c) + ",\"id\":" + std::to_string(arr[c].id) +
                        ",\"priority\":" + std::to_string(arr[c].prio) + "}");
    }

    std::ostringstream o;
    o << "{\"algo\":\"heap\",\"size\":" << arr.size() << ",\"heap\":[";
    for (size_t i = 0; i < arr.size(); ++i) {
        if (i) o << ",";
        o << "{\"id\":" << arr[i].id << ",\"priority\":" << arr[i].prio
          << ",\"index\":" << i << "}";
    }
    o << "],\"steps\":[";
    for (size_t i = 0; i < steps.size(); ++i) {
        if (i) o << ",";
        o << steps[i];
    }
    o << "],\"complexity\":\"O(log N) insert\"";
    return o.str();
}

}  // namespace trees
