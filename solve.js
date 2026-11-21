// Slice-based reader for the csv-reader 1.0.0 broken-record policy.
// All state belongs to this call; quoted-field lookahead commits only on closure.
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const rows = [], errors = [];
  let columns = null, width = -1;
  let p = text.charCodeAt(0) === 65279 ? 1 : 0;
  let line = 1;
  const n = text.length;
  while (p < n) {
    if (text.charCodeAt(p) === 10) { ++p; ++line; continue; }
    if (text.charCodeAt(p) === 13 && text.charCodeAt(p + 1) === 10) {
      p += 2; ++line; continue;
    }
    const recordLine = line;
    const recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let more, quoted;
    do {
      quoted = text.charCodeAt(p) === 34;
      let value = '', junk = false, added = false;
      if (quoted) {
        const open = p;
        let q = p + 1, start = q, quotedLines = 0, closed = false;
        while (q < n) {
          const c = text.charCodeAt(q);
          if (c === 34) {
            value += text.slice(start, q);
            if (text.charCodeAt(q + 1) === 34) {
              value += '"'; q += 2; start = q; continue;
            }
            p = q + 1; line += quotedLines; closed = true; break;
          }
          if (c === 13) {
            value += text.slice(start, q) + '\n';
            q += text.charCodeAt(q + 1) === 10 ? 2 : 1;
            start = q; ++quotedLines; continue;
          }
          if (c === 10) ++quotedLines;
          ++q;
        }
        if (!closed) {
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          value = '"'; p = open + 1;
        } else {
          junk = true;
        }
      }
      let start = p;
      while (p < n) {
        const c = text.charCodeAt(p);
        if (c === 44 || c === 10) break;
        if (c === 13) {
          if (text.charCodeAt(p + 1) === 10) break;
          if (p > start) { value += text.slice(start, p); added = true; }
          errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
          start = ++p;
          continue;
        }
        ++p;
      }
      if (p > start) { value += text.slice(start, p); added = true; }
      if (junk && added) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
      fields.push(value);
      const end = text.charCodeAt(p);
      more = end === 44;
      if (more) ++p;
      else if (end === 10) { ++p; ++line; }
      else if (end === 13) { p += 2; ++line; }
    } while (more);
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
