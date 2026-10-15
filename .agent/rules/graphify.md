## graphify

This project has a graphify knowledge graph at graphify-out/ (built AST-only, no API key needed).

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify MCP server is active, utilize tools like `query_graph`, `get_node`, and `shortest_path` for precise architecture navigation instead of falling back to `grep`
- If the MCP server is not active, the CLI equivalents are `python -m graphify query "<question>" --graph graphify-out/graph.json`, `python -m graphify path "<A>" "<B>"` and `graphify explain "<concept>"` — prefer these over grep for cross-module questions
- After modifying code files in this session, run `python -m graphify update .` (AST-only, no API cost) to keep the graph current; then `python -m graphify cluster-only .` to refresh GRAPH_REPORT.md. Note: only the *initial* build uses the `--code-only` flag; `update` always works AST-only.
- Community names are numeric placeholders (no LLM labeling); use the hub file names in GRAPH_REPORT.md to identify modules
