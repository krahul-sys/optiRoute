# OptiRoute & CoreDB Command Center

An enterprise logistics optimizer that unifies **DAA** (Design & Analysis of Algorithms)
and **RDBMS** curriculum into a single production-grade system, split into two clean layers:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Computational | Hand-written **C++** binary (stateless, stdin/stdout) | AVL, Heap, Graph, Greedy, DP, Backtracking, D&C, Huffman |
| Storage | **Oracle XE (21c)** | DDL, DML views, PL/SQL triggers/procedures, TCL, DCL |
| Middleware | **Python FastAPI** | Connection pooling, subprocess IPC, DCL security gate |
| Presentation | **React + Tailwind** | Command Center dashboard with Professor Evaluation Toggle |

## Architecture: Hybrid Subprocess Pipeline

```
  React UI  ──HTTP──▶  FastAPI  ──oracledb pool──▶  Oracle XE
                         │
                         └──spawn(stdin/stdout)──▶  engine (compiled C++)
```

The C++ engine is **stateless**. Every request the backend fetches rows from Oracle,
serializes them, pipes them into the engine's `stdin`, reads the result JSON from
`stdout`, and the process exits (freeing 100% of its memory).

## Quick start

```powershell
copy .env.example .env
docker compose up --build
```

Then open:

* Frontend dashboard → http://localhost:8090
* Backend OpenAPI docs → http://localhost:8000/docs
* Oracle PDB listener → `localhost:1521`

The first boot of `oracle-db` runs every script in `db/init` (tables, constraints,
views, triggers, roles, seed data) automatically.

## Project layout

```
optiRoute/
├── docker-compose.yml
├── db/init/                 # Oracle bootstrap scripts (run in lexical order)
├── backend/
│   ├── app/                 # FastAPI middleware
│   └── engine/              # C++ DAA engine (multi-stage compiled)
└── frontend/                # React + Tailwind dashboard
```

## The five feature screens

1. **Logistics Map** – D3/SVG graph, Dijkstra shortest path, MST, node creation (INSERT).
2. **Smart Dispatch** – Max-Heap priority queue + 0/1 Knapsack truck loader.
3. **Core Index Inspector** – live AVL tree with rotation animation.
4. **Database Control** – DCL role simulator, PL/SQL trigger feed, TCL rollback sandbox.
5. **System Reports** – Quick/Merge sort, Huffman log archiver, multi-table view export.

## Engine CLI contract

```
engine --algo=<name>    # reads structured text from stdin, prints JSON to stdout
```

Supported: `dijkstra`, `mst`, `allpairs`, `knapsack`, `tsp`, `huffman`, `sort`, `lcs`,
`avl`, `heap`, `color`.
