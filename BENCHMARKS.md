# Measured optimization record

These are local, advisory CPU measurements on the kit's public practice input. They are not the contest's CPU heat. Correctness was established with the kit's sealed scorer, rather than inferred from speed.

## Method

Each candidate ran in ten separate Docker containers: one warmup and nine timed processes. The reported value is the mean after dropping the two fastest and two slowest timed processes. Every container had one CPU, 1024 MiB RAM, no swap or network, a read-only bot and input, and a writable output. Timing read Node's `process.cpuUsage()` after importing and executing the actual `main.ts`; it includes startup, input parsing, solving, serialization and output writing, but does not subtract the contest's do-nothing control. Repeats were sequential, never concurrent. The image was the fresh kit's Node image.

Every measurement retains an immutable source snapshot, SHA-256 manifest, input SHA-256, all ten CPU readings and output SHA-256s in the build machine's `csv-measurements/<label>/measurement.json` directory. Snapshots and raw logs are outside the shipped repository. All trials produced the same answer bytes as the house driver.

Practice `cases.json` SHA-256:

`ea5375f1d8045c04f49deefbeb91c4602aff610225024e3529d684d85243a99f`

All output `answers.json` SHA-256:

`bb5b6cc5c523edf0b18a20cd1f577b0d461b3ae021fd3ab2c9b4e4a5f01002ed`

## Results

Times are trimmed mean CPU microseconds. Each candidate changed one feature relative to the retained candidate at the time; rejected changes were removed before the next experiment.

| Label | Change | First run (µs) | Rerun (µs) | Decision |
| --- | --- | ---: | ---: | --- |
| house | Kit csv-reader 1.0.0 | 1,835,938.4 | 1,769,904.2 | Reference baseline |
| v1 | Independent scanner retaining spans as slices | 756,312.6 | 749,828.0 | Retained |
| v2 | Native split on quote-free and stray-CR-free rows | 772,910.8 | 809,295.4 | Reverted |
| v3 | Serialize each case immediately, then join JSON strings | 774,817.0 | 757,764.6 | Reverted |
| v4 | Set maximum semi-space to 128 MiB | 751,126.0 | 737,135.2 | Initially retained; reverted after confirmation measured 765,939.8 |
| v5 | Cached newline/CR positions and indexOf for unquoted fields, on v4 | 878,657.4 | 886,300.0 | Reverted |
| v6 | Single-threaded V8, on v4 | 770,224.6 | 762,480.8 | Reverted |

The final program is v1, not the variant with the single lowest observation. A small apparent tuning win was not repeatable in the confirmation run. No benchmark branch, generated lookup table, native addon, WebAssembly, bundled input or cached answer is shipped.

Final executable-source hashes:

- `solve.js`: `dc7bacbedd1ad3ffdd41e5560ee3abf207107ca053f2f73b3c357b237dfb201c`
- `main.ts`: `f409f782fd575e72f9a57ff2e1bb329cf82d612ebcd998e1c7f59f0d401a0b50`

## Correctness coverage

The Docker grade passed all six public cases, with two deterministic executions and a byte-for-byte L1 regrade. Differential testing compared the implementation with the kit's reference on all strings of lengths zero through seven over `a`, comma, quote, CR and LF, under both header modes. Another 20,000 deterministic randomized cases included a BOM, Unicode, NUL, embedded newlines and broken quoting. All 215,312 comparisons passed.

The kit's runtime-version diagnostic means local results are not claimed to reproduce the official server result hash. Only the official final heat can establish ranking or the required confidence over the house baseline.
