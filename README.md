# parse_geocode_docs

## Description
Command-line utility to fill values using reverse geocoding with [Nominatim API](https://nominatim.openstreetmap.org/). In this example, the empty values ​​in the city column are populated from the longitude and latitude fields (if they match an specified country). This process uses data streams to allow large files to be read and written.

## Data
This example works with tab files with the following data structure (but can be easily customized):

| Timestamp | Country  | City     | Latitude  | Longitude | 
| --------- | -------- | -------- | --------- | --------- |
| Content   | Content  |\[empty\] | Content   | Content   | 
| Content   | Content  |\[empty\] | Content   | Content   |

## Instructions
- Change the column numbers accordingly in cli.js.
- Run `node cli.js filename.tab`. 
- You can pass a second argument to limit the lines to be readed (default has no limit).

## Todo:
- Add csv support