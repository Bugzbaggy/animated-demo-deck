/* script.js: the spoken script, one entry per animation beat (same order as scenes.js).
   Written by tools/sync-script.mjs from SCRIPT.md, so edit the words there, not here.
   The deck reads it for the presenter view (P), the pause after each beat in auto mode
   and the GIFs (narration time at 135 words per minute, minus the animation), and the
   presenter's target clock. */
window.SCRIPT = {
  title: 'Cards kit: the checkout slowdown',
  audience: 'anyone trying the Cards kit (a made-up example)',
  scenes: [
    {
      id: 'intro', slide: 'The checkout slowdown',
      beats: [
        { beatId: 'title', cue: 'The title builds word by word on the dark slide.',
          say: 'This is a story about nine slow minutes at an online shop: one release, one alert, one chat thread, and the rollback that ended it.' },
        { beatId: 'alert', cue: "The alert's message card slides in; its latency is highlighted.",
          say: 'It started with an alert at two minutes past ten. Checkout latency at the ninety-fifth percentile: two thousand four hundred milliseconds, three times the threshold.' },
        { beatId: 'chips', cue: 'Three chips pop in under the title.',
          say: 'Everything you will see is the thread as it was posted. The times are UTC, and every name on screen is an example.' },
      ],
    },
    {
      id: 'thread', slide: 'Eighty-five seconds to a lead',
      beats: [
        { beatId: 'alert', cue: 'The thread window opens on the alert; "error rate rising" is highlighted; the first side card appears.',
          say: 'Here is that thread. The alert said the latency was high, and it added that the error rate was rising. Hold on to that second part.' },
        { beatId: 'lead', cue: "The on-call engineer's reply comes in; the hit-rate line is highlighted; the second card and the chips appear.",
          say: 'Eighty-five seconds later the on-call engineer answered. The cache hit rate had dropped from ninety-four to twelve percent at nine fifty-eight, right after version two fourteen went out. And the error rate was flat.' },
        { beatId: 'fix', cue: "The release lead's reply and the bot's all-clear come in; the third card appears.",
          say: 'A minute later the release lead named the cause: two fourteen had put the session id into the cart cache key. They rolled back, and at eleven minutes past ten the bot reported a hundred and eighty milliseconds.' },
      ],
    },
    {
      id: 'cause', slide: 'One key per session',
      beats: [
        { beatId: 'cause', cue: 'The first card comes in; the path under the cards draws and the dot appears.',
          say: 'So what happened? The new key included the session, so no two visitors ever shared a cache entry. Every visitor had a cache of one.' },
        { beatId: 'fix', cue: 'The dot moves to the second card, which comes in.',
          say: 'Rolling back to two thirteen put the shared key back, and the latency came back with it.' },
        { beatId: 'guard', cue: 'The dot reaches the dashed third card; the outcome line writes itself and its chips pop in.',
          say: 'Nine minutes and ten seconds from alert to recovery. One thing is still to do: a named reviewer for any release that changes a cache key. That part is not built yet.' },
      ],
    },
  ],

  qa: [
    { q: 'Why did the alert say the error rate was rising?',
      a: 'Its rule adds a trend phrase to the latency check. The on-call engineer measured the error rate and found it flat at 0.2 %, so the deck shows those words as the alert’s wording, not as a finding.' },
    { q: 'Why roll back instead of fixing the key?',
      a: 'The rollback took effect in about five minutes (10:06:30 to 10:11:50); a fix would have needed a build and a review first.' },
  ],

  checklist: [
    'Run the deck once with A (auto-advance) and speak along.',
    'Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.',
    'Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.',
  ],

  // "If you are running long" and "Where the facts come from" in SCRIPT.md; synced like the words.
  cuts: [
    'If slide 3 has not started by {start:cause}, say only the outcome line on its last beat.',
  ],
  sources: [
    'Made-up example: the thread, its posted times (UTC) and its numbers were written for this kit. A real deck names the thread, when it was read, and what is masked.',
  ],
};
