package main

import "testing"

func TestSeedEmails(t *testing.T) {
	for _, args := range [][]string{nil, {"bad"}, {"ok@example.com", "Bad <bad@example.com>"}, {"ok@example.com", "no@"}} {
		if _, err := seedEmails(args); err == nil {
			t.Errorf("seedEmails(%v) accepted invalid input", args)
		}
	}
	got, err := seedEmails([]string{" TEST@Example.com ", "test@example.com", "other@example.org"})
	if err != nil || len(got) != 2 || got[0] != "test@example.com" || got[1] != "other@example.org" {
		t.Fatalf("seedEmails normalized: %v, %v", got, err)
	}
}

func TestIsHealthcheckCommand(t *testing.T) {
	tests := []struct {
		name string
		args []string
		want bool
	}{
		{"no arguments", []string{"server"}, false},
		{"healthcheck subcommand", []string{"server", "healthcheck"}, true},
		{"other argument", []string{"server", "serve"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isHealthcheckCommand(tt.args); got != tt.want {
				t.Errorf("isHealthcheckCommand(%v) = %v, want %v", tt.args, got, tt.want)
			}
		})
	}
}
