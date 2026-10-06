package legacyimport

import (
	"os"
	"strings"
	"testing"
)

func parseFixture(t *testing.T) Dump {
	t.Helper()
	f, err := os.Open("testdata/dump.sql")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	d, err := Parse(f)
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func TestParseFixture(t *testing.T) {
	d := parseFixture(t)
	if d.TimeZone != "+00:00" {
		t.Fatalf("time zone = %q", d.TimeZone)
	}
	for table, want := range map[string]int{"Users": 2, "Cars": 3, "Refuels": 3, "Repairs": 2, "Tickets": 2, "RefreshTokens": 1, "SequelizeMeta": 2} {
		if got := len(d.Tables[table].Rows); got != want {
			t.Errorf("%s rows = %d, want %d", table, got, want)
		}
	}
	cars := d.Tables["Cars"]
	if len(cars.Columns) != 14 || cars.Columns[13] != "purchaseDate" {
		t.Fatalf("Cars columns = %v", cars.Columns)
	}
	ka := cars.Rows[2]
	if ka["name"].Text != "Ka" || !ka["firstRegistration"].Null || !ka["licensePlate"].Null || ka["purchasePrice"].Text != "0" {
		t.Fatalf("Cars row 3 = %v", ka)
	}
}

func TestParseUnescapesStrings(t *testing.T) {
	d := parseFixture(t)
	if got := d.Tables["Refuels"].Rows[0]["station"].Text; got != "O'Neill's Fuel" {
		t.Errorf("station = %q", got)
	}
	repair := d.Tables["Repairs"].Rows[0]
	if got := repair["station"].Text; got != `Garage "Max"` {
		t.Errorf("station = %q", got)
	}
	if got := repair["description"].Text; got != "Brake pads\nfront and rear, C:\\parts" {
		t.Errorf("description = %q", got)
	}
	d = parseString(t, "CREATE TABLE `T` (\n  `a` text,\n  `b` text\n) ENGINE=InnoDB;\nINSERT INTO `T` VALUES ('it''s','\\0\\Z\\%\\x');\n")
	row := d.Tables["T"].Rows[0]
	if row["a"].Text != "it's" || row["b"].Text != "\x00\x1a\\%x" {
		t.Errorf("row = %v", row)
	}
}

func parseString(t *testing.T, s string) Dump {
	t.Helper()
	d, err := Parse(strings.NewReader(s))
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func TestParseUsesDeclaredColumnOrder(t *testing.T) {
	d := parseString(t, "CREATE TABLE `T` (\n  `second` int,\n  `first` int,\n  PRIMARY KEY (`first`)\n) ENGINE=InnoDB;\nINSERT INTO `T` VALUES (2,1);\n")
	row := d.Tables["T"].Rows[0]
	if row["first"].Text != "1" || row["second"].Text != "2" {
		t.Fatalf("row = %v", row)
	}
}

func TestParseMultiLineStatement(t *testing.T) {
	d := parseString(t, "CREATE TABLE `T` (\n  `a` int,\n  `b` text\n) ENGINE=InnoDB;\nINSERT INTO `T` VALUES (1,'x'),\n(2,'line\nbreak'),\n(-3.5,NULL);\nSELECT 1;\n")
	rows := d.Tables["T"].Rows
	if len(rows) != 3 || rows[1]["b"].Text != "line\nbreak" || rows[2]["a"].Text != "-3.5" || !rows[2]["b"].Null {
		t.Fatalf("rows = %v", rows)
	}
}

func TestParseWithoutTimeZoneHeader(t *testing.T) {
	if d := parseString(t, "CREATE TABLE `T` (\n  `a` int\n) ENGINE=InnoDB;\n"); d.TimeZone != "" {
		t.Fatalf("time zone = %q", d.TimeZone)
	}
}

func TestParseRejectsUnreadableInserts(t *testing.T) {
	table := "CREATE TABLE `T` (\n  `a` int,\n  `b` int\n) ENGINE=InnoDB;\n"
	for name, insert := range map[string]string{
		"hex literal":       "INSERT INTO `T` VALUES (0x41,1);",
		"binary prefix":     "INSERT INTO `T` VALUES (_binary 'x',1);",
		"too few values":    "INSERT INTO `T` VALUES (1);",
		"unterminated":      "INSERT INTO `T` VALUES (1,'x",
		"missing separator": "INSERT INTO `T` VALUES (1,2)(3,4);",
		"undeclared table":  "INSERT INTO `U` VALUES (1,2);",
	} {
		t.Run(name, func(t *testing.T) {
			_, err := Parse(strings.NewReader(table + insert + "\n"))
			if err == nil || !strings.Contains(err.Error(), "line ") {
				t.Fatalf("err = %v, want a line-numbered error", err)
			}
		})
	}
}
