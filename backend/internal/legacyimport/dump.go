// Package legacyimport performs the one-time import of the legacy MariaDB
// data, exported by mysqldump, into a fresh v1 database.
package legacyimport

import (
	"fmt"
	"io"
	"regexp"
	"strings"
)

// Value is one literal from an INSERT statement: the unescaped text of a
// string, the literal text of a number, or NULL.
type Value struct {
	Text string
	Null bool
}

// Row maps the column names declared by CREATE TABLE to their values.
type Row map[string]Value

// Table holds a dumped table's declared columns and its rows in dump order.
type Table struct {
	Columns []string
	Rows    []Row
}

// Dump is the parsed content of a mysqldump file.
type Dump struct {
	// TimeZone is the session time zone the dump was written with, or ""
	// when the header does not set one.
	TimeZone string
	Tables   map[string]*Table
}

var (
	createTablePattern = regexp.MustCompile("^CREATE TABLE `([^`]+)` \\($")
	columnPattern      = regexp.MustCompile("^\\s+`([^`]+)`\\s")
	insertPattern      = regexp.MustCompile("^INSERT INTO `([^`]+)` VALUES ")
	timeZonePattern    = regexp.MustCompile(`SET TIME_ZONE='([^']*)'`)
	numberPattern      = regexp.MustCompile(`^[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$`)
)

// Parse reads a mysqldump file. It understands the CREATE TABLE column lists,
// multi-row INSERT statements and the TIME_ZONE header; anything it cannot
// read inside an INSERT is an error naming the line.
func Parse(r io.Reader) (Dump, error) {
	raw, err := io.ReadAll(r)
	if err != nil {
		return Dump{}, err
	}
	content := string(raw)
	dump := Dump{Tables: map[string]*Table{}}
	if m := timeZonePattern.FindStringSubmatch(content); m != nil {
		dump.TimeZone = m[1]
	}

	p := parser{s: content, line: 1}
	var current *Table
	for p.pos < len(p.s) {
		line := p.peekLine()
		switch {
		case current != nil:
			if m := columnPattern.FindStringSubmatch(line); m != nil {
				current.Columns = append(current.Columns, m[1])
			} else if !strings.HasPrefix(strings.TrimSpace(line), "`") {
				// Keys and constraints follow the columns; the closing
				// ") ENGINE=..." line ends the statement.
				if strings.HasPrefix(line, ")") {
					current = nil
				}
			}
			p.skipLine()
		case createTablePattern.MatchString(line):
			name := createTablePattern.FindStringSubmatch(line)[1]
			current = &Table{}
			dump.Tables[name] = current
			p.skipLine()
		case insertPattern.MatchString(line):
			name := insertPattern.FindStringSubmatch(line)[1]
			table := dump.Tables[name]
			if table == nil {
				return Dump{}, fmt.Errorf("line %d: INSERT into %s before its CREATE TABLE", p.line, name)
			}
			p.pos += len(insertPattern.FindString(line))
			rows, err := p.values(table.Columns)
			if err != nil {
				return Dump{}, fmt.Errorf("table %s: %w", name, err)
			}
			table.Rows = append(table.Rows, rows...)
		default:
			p.skipLine()
		}
	}
	if current != nil {
		return Dump{}, fmt.Errorf("unterminated CREATE TABLE at end of file")
	}
	return dump, nil
}

type parser struct {
	s    string
	pos  int
	line int
}

func (p *parser) peekLine() string {
	end := strings.IndexByte(p.s[p.pos:], '\n')
	if end < 0 {
		return p.s[p.pos:]
	}
	return p.s[p.pos : p.pos+end]
}

func (p *parser) skipLine() {
	end := strings.IndexByte(p.s[p.pos:], '\n')
	if end < 0 {
		p.pos = len(p.s)
		return
	}
	p.pos += end + 1
	p.line++
}

func (p *parser) errorf(format string, args ...any) error {
	return fmt.Errorf("line %d: "+format, append([]any{p.line}, args...)...)
}

func (p *parser) next() (byte, bool) {
	if p.pos >= len(p.s) {
		return 0, false
	}
	c := p.s[p.pos]
	p.pos++
	if c == '\n' {
		p.line++
	}
	return c, true
}

func (p *parser) skipSpace() {
	for p.pos < len(p.s) && strings.IndexByte(" \t\r\n", p.s[p.pos]) >= 0 {
		p.next()
	}
}

// values reads "(...),(...);" and returns one row per tuple.
func (p *parser) values(columns []string) ([]Row, error) {
	var rows []Row
	for {
		p.skipSpace()
		if c, ok := p.next(); !ok || c != '(' {
			return nil, p.errorf("expected '(' to start a row")
		}
		var tuple []Value
		for {
			p.skipSpace()
			v, err := p.value()
			if err != nil {
				return nil, err
			}
			tuple = append(tuple, v)
			p.skipSpace()
			c, ok := p.next()
			if !ok {
				return nil, p.errorf("unterminated row")
			}
			if c == ')' {
				break
			}
			if c != ',' {
				return nil, p.errorf("unexpected %q in row", c)
			}
		}
		if len(tuple) != len(columns) {
			return nil, p.errorf("row has %d values, table declares %d columns", len(tuple), len(columns))
		}
		row := make(Row, len(columns))
		for i, column := range columns {
			row[column] = tuple[i]
		}
		rows = append(rows, row)

		p.skipSpace()
		c, ok := p.next()
		if !ok {
			return nil, p.errorf("unterminated INSERT statement")
		}
		if c == ';' {
			return rows, nil
		}
		if c != ',' {
			return nil, p.errorf("unexpected %q between rows", c)
		}
	}
}

func (p *parser) value() (Value, error) {
	if p.pos < len(p.s) && p.s[p.pos] == '\'' {
		p.next()
		return p.quoted()
	}
	start := p.pos
	for p.pos < len(p.s) && strings.IndexByte(",) \t\r\n", p.s[p.pos]) < 0 {
		p.next()
	}
	literal := p.s[start:p.pos]
	switch {
	case literal == "NULL":
		return Value{Null: true}, nil
	case numberPattern.MatchString(literal):
		return Value{Text: literal}, nil
	default:
		return Value{}, p.errorf("unsupported literal %q", literal)
	}
}

// quoted reads the rest of a single-quoted string, undoing MySQL escapes.
func (p *parser) quoted() (Value, error) {
	var b strings.Builder
	for {
		c, ok := p.next()
		if !ok {
			return Value{}, p.errorf("unterminated string")
		}
		switch c {
		case '\'':
			if p.pos < len(p.s) && p.s[p.pos] == '\'' {
				p.next()
				b.WriteByte('\'')
				continue
			}
			return Value{Text: b.String()}, nil
		case '\\':
			e, ok := p.next()
			if !ok {
				return Value{}, p.errorf("unterminated string")
			}
			switch e {
			case '0':
				b.WriteByte(0)
			case 'b':
				b.WriteByte('\b')
			case 'n':
				b.WriteByte('\n')
			case 'r':
				b.WriteByte('\r')
			case 't':
				b.WriteByte('\t')
			case 'Z':
				b.WriteByte(0x1a)
			case '%', '_':
				// MySQL keeps the backslash for LIKE wildcards.
				b.WriteByte('\\')
				b.WriteByte(e)
			default:
				b.WriteByte(e)
			}
		default:
			b.WriteByte(c)
		}
	}
}
