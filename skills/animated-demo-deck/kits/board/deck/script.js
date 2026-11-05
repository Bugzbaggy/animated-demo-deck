/* script.js: the spoken script, one entry per animation beat (same order as scenes.js).
   Written by tools/sync-script.mjs from SCRIPT.md, so edit the words there, not here.
   The deck reads it for the presenter view (P), the pause after each beat in auto mode
   and the GIFs (narration time at 135 words per minute, minus the animation), and the
   presenter's target clock. */
window.SCRIPT = {
  title: 'Board kit: the checkout slowdown',
  audience: 'anyone trying the Board kit (a made-up example)',
  scenes: [
    {
      id: 'what', slide: 'A deploy, then a slow checkout',
      beats: [
        { beatId: 'fly-in', cue: 'The camera flies from the whole board into the first region; the title writes itself.',
          say: "This is the whole story on one board. Let's start on the left, with what the alert saw." },
        { beatId: 'chain', cue: 'Four boxes are sketched in a row; arrows and their labels draw between them.',
          say: 'Version two fourteen goes out at nine fifty-eight. Its new cache key means misses, misses mean every request reads the database, and so checkout slows to twenty-four hundred milliseconds.' },
        { beatId: 'claim', cue: 'The alert is taped on; "error rate rising" is struck out and "0.2 %, flat" is written beside it; a green note sticks on.',
          say: 'Here is the alert, taped on. It says the error rate is rising. It was not: the errors stayed at zero point two percent, so I cross that part out.' },
      ],
    },
    {
      id: 'why', slide: 'One key per session',
      beats: [
        { beatId: 'hop', cue: 'The camera hops to the second region; the before and after boxes are sketched.',
          say: 'Why did the cache miss? Because of the key. On the left, before: one entry per cart. On the right, after.' },
        { beatId: 'circle', cue: 'The old key is underlined, an arrow draws across, and the session id is circled in red.',
          say: 'This piece here, the session id, makes every key unique, so no two visitors ever share an entry.' },
        { beatId: 'notes', cue: 'Two notes stick on; 94 % is struck and 12 % stands beside it.',
          say: 'So the hit rate falls from ninety-four percent to twelve, and every visitor starts with an empty cache.' },
      ],
    },
    {
      id: 'fix', slide: 'Roll back, then guard',
      beats: [
        { beatId: 'hop', cue: 'The camera hops to the last region; two green boxes, an arrow and two ticks.',
          say: 'What ended it: a rollback to two thirteen at ten oh six, and by ten eleven the latency is back to a hundred and eighty.' },
        { beatId: 'later', cue: 'A dashed "later" box, a pencil arrow, and the alert-to-recovery note.',
          say: "And what comes next is drawn dashed, because it isn't built yet: a review for any change to a cache key." },
        { beatId: 'pull-back', cue: 'The camera pulls back to the whole board.',
          say: 'Step back and the board is the summary: nine minutes and ten seconds from the alert to recovery.' },
      ],
    },
  ],

  qa: [
    { q: 'Why is the alert taped on and not redrawn?',
      a: 'It is evidence: Board shows a source as a printout, as posted, and writes the correction beside it ("0.2 %, flat") instead of editing it.' },
    { q: 'Why is the last box dashed?',
      a: 'The review step is not built. Board draws anything not deployed as a dashed box labelled "later", never as a solid one.' },
  ],

  checklist: [
    'Run the deck once with A (auto-advance) and speak along.',
    'Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.',
    'Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.',
  ],

  // "If you are running long" and "Where the facts come from" in SCRIPT.md; synced like the words.
  cuts: [
    'If slide 3 has not started by {start:fix}, say the "later" beat in one sentence.',
  ],
  sources: [
    'Made-up example: the alert, its time (UTC) and every number on the board were written for this kit. A real deck names the source of each printout and who posted it, and when.',
  ],
};
