# 10-run playtest review

Run the native player with local recording enabled. This switch creates no player-facing control and writes
only local JSONL summaries to `user://black-stela-playtest-records.jsonl`.

```sh
npm run play -- --playtest-record
```

For ten completed expeditions, copy one JSON line per return and add the observed player-facing note below.
Do not add full save data, names, inventory, or logs to the record; those are intentionally excluded.

| Run | World | Elapsed | Result | Return reason | Command families | Last floor / cell | Player-facing note | Follow-up |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |

## Review questions

1. Did a run make the next decision legible before resources or HP forced a retreat?
2. Did a return reason match what the player believed they used (stairs, marker, retreat)?
3. Which command family dominated a run, and did that feel deliberate rather than like repeated UI repair?
4. Did the final visible floor/cell make the outcome explainable without opening diagnostics?
5. Are two or more runs pointing to the same content, controller, clarity, or pacing problem? Add that as a
   concrete item in `Tasks.md`, not as a new telemetry field.
