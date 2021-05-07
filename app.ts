import { exit } from 'process';

var fs = require('fs');
var parseMidi = require('midi-file').parseMidi;

function toHz(note: number): number {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * 2 ** ((note - 9) / 12);
}
var inputFile = process.argv[2] == undefined ? './in.mid' : process.argv[2];
var outputFile = process.argv[3] == undefined ? './out' : process.argv[3];
try {
    var trackNo = process.argv[4] == undefined ? 0 : parseInt(process.argv[4]);
} catch (err) {
    console.error('Wrong input for track number');
    exit(3);
}
// Read MIDI file into a buffer
try {
    var input = fs.readFileSync(inputFile);
} catch (err) {
    console.error("Couldn't open file", inputFile);
    console.error('Possible cause: wrong filename');
    exit(1);
}

// Parse it into an intermediate representation
// This will take any array-like object. It just needs to support .length, .slice, and the [] indexed element getter.
// Buffers do that, so do native JS arrays, typed arrays, etc.
var parsed = parseMidi(input);
var final: { note: number; length: number; wait: number }[] = [];
var lengths: number[] = [];
var temp: { note: number; time: number }[] = [];

try {
    for (var message of parsed.tracks[trackNo]) {
        if (message.type === 'noteOn') {
            temp.push({ note: message.noteNumber, time: message.deltaTime });
        } else if (message.type === 'noteOff') {
            for (var i in temp) {
                if (temp[i].note == message.noteNumber) {
                    final.push({
                        note: temp[i].note,
                        length: message.deltaTime,
                        wait: temp[i].time,
                    });
                    if (!lengths.includes(message.deltaTime))
                        lengths.push(message.deltaTime);
                    temp.splice(parseInt(i), 1);
                }
            }
        }
    }
} catch (err) {
    console.error('An error has occured while converting the midi data');
    console.error('Possible cause: wrong track number');
    exit(2);
}
final = final.map((note) => {
    return {
        note: (note.note = toHz(note.note)),
        length: note.length,
        wait: note.wait,
    };
});
var statements = '';
for (var i in final) {
    statements +=
        final[i].wait > 1 ? 'basic.pause(' + final[i].wait + ')\n' : '';
    statements +=
        final[i].length > 1 ? 'music.ringTone(' + final[i].note + ')\n' : '';
    statements +=
        final[i].length > 1 ? 'basic.pause(' + final[i].length + ')\n' : '';
    statements +=
        final[parseInt(i) + 1]?.wait > 1 ? 'music.stopAllSounds()\n' : '';
}
statements += 'music.stopAllSounds()';
try {
    fs.writeFile(outputFile + '.js', statements, (err: Error) => {
        if (err) throw err;
    });
} catch (err) {
    console.error("Couldn't write output file", outputFile);
    exit(4);
}
