# Midi to Micro:bit

Converts a midi file to a script executable by the microbit

### If you don't want to comile it yourself, go to the [releases](https://github.com/lolocomotive/Midi2Microbit/releases/latest) page
<br><br><br>
# If you want to compile it yourself / work on it:

## Installing

```
npm i
```

## Running for developpement

```
npm run dev
```

## Building

```
npm run build
```

## Runnning (after build)

```
npm start <input file> <output file> <track number>
```

The input is `in.mid`, the program will take th track 0 and store it as notes in `out.js` by default
