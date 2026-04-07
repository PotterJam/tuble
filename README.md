# Tuble

A Tube-themed puzzle game built with React and Vite.

## Setup

```bash
npm install
```

### Generate graph data

Before running or testing, you might need to generate the tube graph data from the TfL API:

```bash
npm run build-graph
```

This fetches London Underground topology and writes two files into `src/data/`:

- `tube-graph.json` — stations and adjacency graph
- `lines.json` — line names and colours

These files are checked in, so you may not need to run this step, but if any topology has changed this shoud update it.

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```
