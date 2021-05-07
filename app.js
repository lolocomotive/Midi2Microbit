var _a;
var fs = require('fs');
var parseMidi = require('midi-file').parseMidi;
var writeMidi = require('midi-file').writeMidi;
function toHz(note) {
    var a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * Math.pow(2, (note - 9) / 12);
}
// Read MIDI file into a buffer
var input = fs.readFileSync('./Mario Bros. - Super Mario Bros. Theme.mid');

// Parse it into an intermediate representation
// This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
// Buffers do that, so do native JS arrays, typed arrays, etc.
var parsed = parseMidi(input);
var final = [];
var lengths = [];
var temp = [];
for (var _i = 0, _b = parsed.tracks[0]; _i < _b.length; _i++) {
    var message = _b[_i];
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
final = final.map(function (note) {
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
        ((_a = final[parseInt(i) + 1]) === null || _a === void 0
            ? void 0
            : _a.wait) > 1
            ? 'music.stopAllSounds()\n'
            : '';
}
statements += 'music.stopAllSounds()';
fs.writeFile('notes.js', statements, function (err) {
    if (err) throw err;
});
