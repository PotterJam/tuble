# Data sources

## tube-graph.json / lines.json

Generated from the TfL API using `scripts/build-graph.ts`. Run `npm run build-graph` to regenerate.

## station-codes.json

3-letter station codes sourced from the TfL published station abbreviations list and supplemented with codes for Elizabeth line stations.

Source: https://content.tfl.gov.uk/station-abbreviations.pdf

## ridership.json

Average daily entry+exit tap counts per station, computed from TfL's station footfall data for 2025-2026.

Source: https://crowding.data.tfl.gov.uk/Network%20Demand/StationFootfall_2025_2026%20.csv

To regenerate:

```bash
curl -o footfall.csv 'https://crowding.data.tfl.gov.uk/Network%20Demand/StationFootfall_2025_2026%20.csv'
npm run build-ridership -- footfall.csv
```

Licensed under TfL Open Data terms. Required attribution (included in the app footer):
- "Powered by TfL Open Data"
- "Contains OS data (c) Crown copyright and database rights 2016 and Geomni UK Map data (c) and database rights [2019]"
