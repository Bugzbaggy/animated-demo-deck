/* script.js: the spoken script, one entry per animation beat (same order as scenes.js).
   Written by tools/sync-script.mjs from SCRIPT.md, so edit the words there, not here.
   The deck reads it for the presenter view (P), the pause after each beat in auto mode
   and the GIFs (narration time at 135 words per minute, minus the animation), and the
   presenter's target clock. */
window.SCRIPT = {
  title: 'Console kit: the checkout slowdown',
  audience: 'anyone trying the Console kit (a made-up example)',
  scenes: [
    {
      id: 'deploys', slide: 'What changed at 09:58',
      beats: [
        { beatId: 'history', cue: 'The prompt blinks, the history command types, two deploys print; v2.14 is highlighted.',
          say: 'Here is the terminal from that morning. First question: what changed? I list the last two deploys. Version two fourteen went out at nine fifty-eight and ten seconds.' },
        { beatId: 'latency', cue: 'The latency query types; six rows stream; 2,400 ms is highlighted.',
          say: 'Then the latency, in two-minute steps. A hundred and ninety at nine fifty-eight, nineteen fifty at ten, twenty-four hundred at ten oh two.' },
        { beatId: 'gap', cue: 'A # comment line appears and is highlighted.',
          say: 'The deploy at nine fifty-eight ten, the alert at ten oh two forty: two hundred and seventy seconds apart. That line is a comment I worked out, not output.' },
      ],
    },
    {
      id: 'cache', slide: 'One key per session',
      beats: [
        { beatId: 'stats', cue: 'The cache stats command types; the table streams; the 12% row is highlighted.',
          say: 'So I look at the cart cache. Ninety-four percent hits until nine fifty-eight, twelve percent after it.' },
        { beatId: 'diff', cue: 'The shell shrinks to the left; a diff pane opens on the right; the new key line is highlighted.',
          say: 'The pane splits, and the diff between the two versions shows why. The cache key used to be the cart. Now it is the cart plus the session.' },
        { beatId: 'note', cue: 'A note card appears under the diff.',
          say: 'One key per session means every visitor starts with an empty cache.' },
      ],
    },
    {
      id: 'rollback', slide: 'Roll back, then measure',
      beats: [
        { beatId: 'rollback', cue: 'The rollback command types; the spinner turns to a tick; the done line prints.',
          say: 'I roll back to two thirteen. Six pods, and it is done at ten oh seven and five seconds.' },
        { beatId: 'recover', cue: 'The latency query types again; four rows stream; 180 ms is highlighted.',
          say: 'The same latency query, from ten oh six: twenty-three fifty, six forty, two ten, and a hundred and eighty at ten twelve.' },
        { beatId: 'close', cue: 'The closing # comment, three numbers beside the pane, then the prompt and its cursor.',
          say: "Alert to recovery, by the bot's two posts: five hundred and fifty seconds. Two seventy from the deploy to the alert, and a twelve percent hit rate in between." },
      ],
    },
  ],

  qa: [
    { q: 'Is this output real?',
      a: 'No. The whole run is a made-up example for the kit. In a real deck every line comes from a log or a recorded terminal, and a block that only has results is marked summarised.' },
    { q: 'Why is 270 s a comment and not output?',
      a: 'No command printed it: it is the difference of two times that were printed or posted (09:58:10 and 10:02:40). The Console material shows computed numbers as # comments.' },
  ],

  checklist: [
    'Run the deck once with A (auto-advance) and speak along.',
    'Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.',
    'Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.',
  ],

  // "If you are running long" and "Where the facts come from" in SCRIPT.md; synced like the words.
  cuts: [
    'If slide 2 has not started by {start:cache}, say its diff beat in one sentence and skip the note.',
  ],
  sources: [
    'Made-up example: every command, output line and time (UTC) was written for this kit. A real deck names the log or transcript each block comes from, and says which blocks are summarised.',
  ],
};
