import { exit } from 'process';

var fs = require('fs');
var parseMidi = require('midi-file').parseMidi;

function pad(n: string, width: number, z: string = '0') {
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
var inputFile = process.argv[2] == undefined ? './in.mid' : process.argv[2];
var outputFile = process.argv[3] == undefined ? './out' : process.argv[3];
try {
    var trackNo = process.argv[4] == undefined ? 0 : parseInt(process.argv[4]);
} catch (err) {
    console.error('Wrong input for track number');
    exit(3);
}
try {
    var speed =
        process.argv[5] == undefined ? 1 : 1 / parseInt(process.argv[5]);
} catch (err) {
    console.error('Wrong input for speed modifier');
    exit(4);
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
var final: {
    note: number;
    length: number;
    wait: number;
    velocity: number;
}[] = [];
var lengths: number[] = [];
var temp: { note: number; time: number; velocity: number }[] = [];
console.log('HINT: File has', parsed.tracks.length, 'tracks');
try {
    for (var message of parsed.tracks[trackNo]) {
        if (message.type === 'noteOn') {
            temp.push({
                note: message.noteNumber,
                time: message.deltaTime * speed,
                velocity: message.velocity * 2,
            });
        } else if (message.type === 'noteOff') {
            for (var i in temp) {
                if (temp[i].note == message.noteNumber) {
                    final.push({
                        note: temp[i].note,
                        length: message.deltaTime * speed,
                        wait: temp[i].time,
                        velocity: temp[i].velocity,
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

var melody = '';
for (var i in final) {
    if (final[i].length != 0) {
        var tmp =
            Math.round(final[i].note).toString(16) +
            pad(final[i].length.toString(36), 3) +
            pad(final[i].wait.toString(36), 3) +
            final[i].velocity.toString(16);
        if (tmp.length > 10) {
            console.log(
                'Too long note omitted',
                tmp,
                'with a length of' + tmp.length
            );
        } else {
            melody += tmp;
        }
    }
}
var output =
    'function realPow (a: number, n: number) {\n' +
    '    return Math.exp((n*Math.log(a)))\n' +
    '}\n' +
    'function toHz (note: number) {\n' +
    '    return 13.75 * realPow(2, (note - 9) / 12)\n' +
    '}\n' +
    'function playMelody (melody: string) {\n' +
    '    let freq,nextTime,length,time,volume,note\n' +
    'freq = 0.1\n' +
    '    for (let i = 0; i <= melody.length / 10 - 1; i++) {\n' +
    '        note = melody.substr(i * 10, 10)\n' +
    '        freq = toHz(parseInt(note.substr(0,2),16))\n' +
    '        length = parseInt(note.substr(2, 3), 36);\n' +
    'time = parseInt(note.substr(5, 3), 36);\n' +
    'volume = parseInt(note.substr(8, 2), 16);\n' +
    'nextTime = parseInt(melody.substr((i + 1) * 10, 10).substr(8, 2), 16);\n' +
    'music.setVolume(volume)\n' +
    '        led.toggle(i / 5 % 5, i % 5)\n' +
    '        if (time > 1) {\n' +
    '            basic.pause(time)\n' +
    '        }\n' +
    '        if (length > 1) {\n' +
    '            music.ringTone(freq)\n' +
    '            basic.pause(length)\n' +
    '        }\n' +
    '        if (nextTime > 1) {\n' +
    '            music.stopAllSounds()\n' +
    '        }\n' +
    '    }\n' +
    '    music.stopAllSounds()\n' +
    '}\n' +
    `let track = "${melody}"\n` +
    'playMelody(track)';
try {
    fs.writeFile(outputFile + '.js', output, (err: Error) => {
        if (err) throw err;
        console.log('Fnished conversion!');
    });
} catch (err) {
    console.error("Couldn't write output file", outputFile);
    exit(4);
}
