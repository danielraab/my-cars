package main

import "testing"

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
