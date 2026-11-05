/* script.js: the spoken script, one entry per animation beat (same order as scenes.js).
   Written by tools/sync-script.mjs from SCRIPT.md, so edit the words there, not here.
   The deck reads it for the presenter view (P), the pause after each beat in auto mode
   and the GIFs (narration time at 135 words per minute, minus the animation), and the
   presenter's target clock. */
window.SCRIPT = {
  title: 'Dashboard kit: the checkout slowdown',
  audience: 'anyone trying the Dashboard kit (a made-up example)',
  scenes: [
    {
      id: 'screen', slide: 'One service, one screen',
      beats: [
        { beatId: 'up', cue: 'The screen comes up: top bar, three green tiles, the rail with four event markers.',
          say: "This is the checkout service's screen, at ten to ten in the morning. Every tile is green, and the rail along the bottom covers the next twenty-five minutes." },
        { beatId: 'numbers', cue: 'The latency counts to 180, the hit-rate arc fills to 94%, both sparklines draw.',
          say: 'Latency at the ninety-fifth percentile: a hundred and eighty milliseconds. Cache hit rate: ninety-four percent. Errors: zero point two percent.' },
        { beatId: 'latest', cue: 'The Latest tile comes in with two fact rows.',
          say: 'The latest tile: version two thirteen has been live since the tenth, and there are no open alerts.' },
      ],
    },
    {
      id: 'incident', slide: 'The needle reaches the alert',
      beats: [
        { beatId: 'deploy', cue: 'The needle runs to 09:58:10 and the deploy marker pings; the event log opens with its first row.',
          say: 'Nine fifty-eight and ten seconds: version two fourteen rolls out. Nothing on the screen moves yet.' },
        { beatId: 'alert', cue: 'The hit-rate arc drains to 12% and flips red; the alert marker pings; latency counts up to 2,400 and flips red; the alert row lands.',
          say: 'Ten oh two forty: latency at twenty-four hundred milliseconds, the cache hit rate down to twelve percent, and the alert fires. It also claims the error rate is rising.' },
        { beatId: 'reply', cue: "The on-call row lands, then the reply's one quote, then claimed against measured, row by row.",
          say: 'Ten oh four oh five, eighty-five seconds after the alert: the on-call engineer points at the cache. Claimed against measured: the error rate never moved from zero point two.' },
      ],
    },
    {
      id: 'recovery', slide: 'Rollback, then the close',
      beats: [
        { beatId: 'rollback', cue: 'The needle reaches the rollback marker; the rollback tile fills its gauge and turns green.',
          say: 'Ten oh six thirty: the rollback to two thirteen starts. All six pods are on the old version by ten oh seven oh five.' },
        { beatId: 'clear', cue: 'Latency counts down to 180, the arc refills to 93%, the all-clear marker pings, both tiles flip green.',
          say: 'Ten eleven fifty: latency back to a hundred and eighty, the hit rate back to ninety-three, and both tiles flip back to green.' },
        { beatId: 'close', cue: 'The closing tile counts its three intervals; the error rate pops in.',
          say: 'Three numbers to keep: two hundred and seventy seconds from the deploy to the alert, eighty-five to the first lead, and five hundred and fifty to recovery.' },
      ],
    },
  ],

  qa: [
    { q: 'Why does the reply get only one quote?',
      a: 'Dashboard shows a message as one event row and its facts; a message gets at most one verbatim passage, here the hit-rate sentence.' },
    { q: 'Where does the 93% come from?',
      a: 'The cache stats for the 10:10 to 10:14 window, in this made-up example. Every number on a Dashboard slide has a source row in facts-sheet.csv.' },
  ],

  checklist: [
    'Run the deck once with A (auto-advance) and speak along.',
    'Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.',
    'Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.',
  ],

  // "If you are running long" and "Where the facts come from" in SCRIPT.md; synced like the words.
  cuts: [
    'If slide 3 has not started by {start:recovery}, say only the close beat on it.',
  ],
  sources: [
    'Made-up example: every tile value, event time (UTC) and quote was written for this kit; facts-sheet.csv lists each one with its source in the story.',
  ],
};
